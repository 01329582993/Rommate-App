import { apiRequest } from './api';

export async function createGroup(name: string) {
  return apiRequest('/api/groups/create', {
    method: 'POST',
    body: { name },
  });
}

export async function getMyGroup() {
  return apiRequest('/api/groups/me');
}

export async function joinGroup(inviteCode: string) {
  return apiRequest('/api/groups/join', {
    method: 'POST',
    body: { inviteCode },
  });
}

export async function addMemberToGroup(email: string) {
  return apiRequest('/api/groups/members/add', {
    method: 'POST',
    body: { email },
  });
}

export async function removeMemberFromGroup(email: string) {
  return apiRequest('/api/groups/members/remove', {
    method: 'POST',
    body: { email },
  });
}

export async function lockGroup() {
  return apiRequest('/api/groups/lock', {
    method: 'POST',
  });
}

export async function leaveGroup() {
  return apiRequest('/api/groups/leave', {
    method: 'POST',
  });
}
