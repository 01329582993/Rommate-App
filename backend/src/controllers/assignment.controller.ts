import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { calculateCompatibility, Profile as ScoringProfile } from '../utils/scoring';

export const runAutoAssignment = async (req: Request, res: Response) => {
  try {
    // 1. Get all students who are NOT in a group
    const unmatchedStudents = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        groupId: null,
      },
      include: {
        profile: true,
      },
    });

    if (unmatchedStudents.length === 0) {
      return res.json({ message: 'No unmatched students found.' });
    }

    // 2. Group by gender
    const byGender: Record<string, typeof unmatchedStudents> = {};
    unmatchedStudents.forEach(s => {
      const g = s.gender || 'OTHER';
      if (!byGender[g]) byGender[g] = [];
      byGender[g].push(s);
    });

    const results: any[] = [];
    const unassignable: any[] = [];

    // 3. Process each gender group
    for (const gender in byGender) {
      let pool = [...byGender[gender]];
      
      while (pool.length >= 3) {
        // Find best group for the first student in the pool
        const lead = pool[0];
        let bestGroup: typeof pool = [lead];
        let remaining = pool.slice(1);

        // Find up to 3 more compatible students (target group size 4, min 3)
        while (bestGroup.length < 4 && remaining.length > 0) {
          let bestCandidateIndex = -1;
          let bestScore = -1;

          for (let i = 0; i < remaining.length; i++) {
            const candidate = remaining[i];
            
            // Calculate average compatibility with current group members
            let totalScore = 0;
            let possible = true;

            for (const member of bestGroup) {
              if (!lead.profile || !candidate.profile) {
                possible = false;
                break;
              }
              const result = calculateCompatibility(
                member.profile as unknown as ScoringProfile,
                candidate.profile as unknown as ScoringProfile
              );
              
              if (result.score === 0) { // Deal breaker
                possible = false;
                break;
              }
              totalScore += result.score;
            }

            if (possible) {
              const avgScore = totalScore / bestGroup.length;
              if (avgScore > bestScore) {
                bestScore = avgScore;
                bestCandidateIndex = i;
              }
            }
          }

          if (bestCandidateIndex !== -1) {
            bestGroup.push(remaining[bestCandidateIndex]);
            remaining.splice(bestCandidateIndex, 1);
          } else {
            break; // No more compatible candidates
          }
        }

        // If we found a group of at least 3, create it
        if (bestGroup.length >= 3) {
          const groupName = `Auto Group ${gender} - ${Date.now().toString().slice(-4)}`;
          const newGroup = await prisma.group.create({
            data: {
              name: groupName,
              members: {
                connect: bestGroup.map(m => ({ id: m.id }))
              }
            }
          });
          results.push({ groupName, members: bestGroup.map(m => m.name), count: bestGroup.length });
          
          // Remove these students from the pool
          const memberIds = new Set(bestGroup.map(m => m.id));
          pool = pool.filter(p => !memberIds.has(p.id));
        } else {
          // If we couldn't form a group for the lead, skip them for now
          // Track as unassignable
          const skipped = pool.shift();
          if (skipped) unassignable.push(skipped);
        }
      }
      
      // Any remaining in pool (< 3) are unassignable for now
      pool.forEach(p => unassignable.push(p));
    }

    res.json({
      message: 'Auto-assignment completed successfully',
      assignments: results,
      unassignable: unassignable.map(u => ({ id: u.id, name: u.name, gender: u.gender })),
      remainingUnmatched: (await prisma.user.count({ where: { role: 'STUDENT', groupId: null } }))
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error running auto-assignment', error: error.message });
  }
};
