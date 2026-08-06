import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import fs from 'fs';
import csv from 'csv-parser';

export const getStudents = async (req: Request, res: Response) => {
  try {
    const students = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      include: {
        profile: true,
        group: {
          include: {
            room: true
          }
        }
      }
    });

    // Map to the format Admin expects
    const formattedStudents = students.map(s => {
      let roomStatus = 'Unassigned';
      if (s.groupId) {
        roomStatus = s.group?.roomId ? 'Assigned' : 'Pending Room';
      }

      // Calculate a "compatibility score" with their current group if they are in one,
      // or just return a default value since they aren't matched yet.
      // For the admin table, maybe we show an average compatibility if they are in a group.
      // But for simplicity, we'll return 0 if unassigned, or a mock number, or calculate it.
      let compatibility = 0;
      if (s.groupId) {
         compatibility = 100; // Mock 100 for now if they are grouped.
      }

      return {
        id: s.id,
        name: s.name,
        email: s.email,
        compatibility,
        roomStatus
      };
    });

    res.json(formattedStudents);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching students', error: error.message });
  }
};

export const uploadStudents = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No CSV file uploaded' });
    }

    const results: any[] = [];
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        let addedCount = 0;
        for (const row of results) {
          // Expected CSV format: Name, Email, StudentId, Gender
          const { Name, Email, StudentId, Gender } = row;
          if (Name && Email) {
            // Check if exists
            const existing = await prisma.user.findUnique({ where: { email: Email } });
            if (!existing) {
              await prisma.user.create({
                data: {
                  name: Name,
                  email: Email,
                  studentId: StudentId || null,
                  gender: (Gender?.toUpperCase() as any) || 'OTHER',
                  role: 'STUDENT'
                }
              });
              addedCount++;
            }
          }
        }
        
        // Clean up the uploaded file
        if (req.file) {
           fs.unlinkSync(req.file.path);
        }

        res.json({ message: `Successfully uploaded ${addedCount} students` });
      });
  } catch (error: any) {
    res.status(500).json({ message: 'Error processing CSV', error: error.message });
  }
};
