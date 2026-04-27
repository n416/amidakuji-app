// lib/api.ts

async function request(endpoint: string, method: string = 'GET', body: any = null, headers: Record<string, string> = {}): Promise<any> {
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    credentials: 'include',
  };
  if (body) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(endpoint, options);
  const contentType = res.headers.get('content-type');

  if (!res.ok) {
    if (contentType && contentType.includes('application/json')) {
      const errData = await res.json();
      throw errData;
    }
    throw new Error(`Server error: ${res.status} ${res.statusText}`);
  }

  if (contentType && contentType.includes('application/json')) {
    return res.json();
  }
  return;
}

export const checkGoogleAuthState = (): Promise<any> => request('/api/user/me');
export const updateLastGroup = (groupId: string): Promise<any> => request('/api/user/me/last-group', 'POST', {groupId});
export const deleteUserAccount = (): Promise<any> => request('/api/user/me', 'DELETE');
export const getGroups = (): Promise<any> => request('/api/groups');
export const getGroup = (groupId: string): Promise<any> => request(`/api/groups/${groupId}`);
export const getGroupByCustomUrl = (customUrl: string): Promise<any> => request(`/api/groups/url/${customUrl}`);
export const createGroup = (groupName: string): Promise<any> => request('/api/groups', 'POST', {groupName, participants: []});
export const deleteGroup = (groupId: string): Promise<any> => request(`/api/groups/${groupId}`, 'DELETE');
export const updateGroupSettings = (groupId: string, settings: any): Promise<any> => request(`/api/groups/${groupId}/settings`, 'PUT', settings);
export const verifyGroupPassword = (groupId: string, password: string): Promise<any> => request(`/api/groups/${groupId}/verify-password`, 'POST', {password});
export const deleteGroupPassword = (groupId: string): Promise<any> => request(`/api/groups/${groupId}/password`, 'DELETE');
export const getEventsForGroup = (groupId: string): Promise<any> => request(`/api/groups/${groupId}/events`);
export const getEventsByCustomUrl = (customUrl: string): Promise<any> => request(`/api/groups/url/${customUrl}/events`);
export const loginOrRegisterToGroup = (groupId: string, name: string, password?: string): Promise<any> => request(`/api/groups/${groupId}/login-or-register`, 'POST', {name, password});
export const loginMemberToGroup = (groupId: string, memberId: string, password?: string): Promise<any> => request(`/api/groups/${groupId}/login`, 'POST', {memberId, password});
export const getPublicEventsForGroup = (groupId: string): Promise<any> => request(`/api/events/by-group/${groupId}`);
export const getEvent = (id: string): Promise<any> => request(`/api/events/${id}`);
export const createEvent = (eventData: any): Promise<any> => request('/api/events', 'POST', eventData);
export const updateEvent = (id: string, eventData: any): Promise<any> => request(`/api/events/${id}`, 'PUT', eventData);
export const copyEvent = (eventId: string): Promise<any> => request(`/api/events/${eventId}/copy`, 'POST');
export const deleteEvent = (eventId: string): Promise<any> => request(`/api/events/${eventId}`, 'DELETE');
export const startEvent = (eventId: string): Promise<any> => request(`/api/events/${eventId}/start`, 'POST');
export const generateEventPrizeUploadUrl = (eventId: string, fileType: string, fileHash: string, groupId?: string): Promise<any> => request(`/api/events/${eventId}/generate-upload-url`, 'POST', {fileType, fileHash, groupId});
export const addDoodle = (eventId: string, memberId: string, doodle: any, token?: string | null): Promise<any> => {
  const headers: Record<string, string> = {};
  if (token) headers['x-auth-token'] = token;
  return request(`/api/events/${eventId}/doodle`, 'POST', {memberId, doodle}, headers);
};
export const deleteDoodle = (eventId: string, memberId: string, token?: string | null): Promise<any> => {
  const headers: Record<string, string> = {};
  if (token) headers['x-auth-token'] = token;
  return request(`/api/events/${eventId}/doodle`, 'DELETE', {memberId}, headers);
};

export const getPublicEventData = (eventId: string, memberId?: string | null, token?: string | null): Promise<any> => {
  const headers: Record<string, string> = {};
  if (memberId && token) {
    headers['x-member-id'] = memberId;
    headers['x-auth-token'] = token;
  }
  return request(`/api/events/${eventId}/public`, 'GET', null, headers);
};

export const getPublicShareData = (eventId: string, participantName: string): Promise<any> => request(`/api/share/${eventId}/${encodeURIComponent(participantName)}`);
export const joinEvent = (eventId: string, name: string, memberId?: string): Promise<any> => request(`/api/events/${eventId}/join`, 'POST', {name, memberId});
export const joinSlot = (eventId: string, memberId: string, token: string, slot: number): Promise<any> => request(`/api/events/${eventId}/join-slot`, 'POST', {memberId, slot}, {'x-auth-token': token});
export const verifyPasswordAndJoin = (eventId: string, memberId: string, password: string, slot?: number): Promise<any> => request(`/api/events/${eventId}/verify-password`, 'POST', {memberId, password, slot});
export const deleteParticipant = (eventId: string, token: string): Promise<any> => request(`/api/events/${eventId}/participants`, 'DELETE', {deleteToken: token});
export const getMemberSuggestions = (groupId: string, q: string): Promise<any> => request(`/api/groups/${groupId}/member-suggestions?q=${encodeURIComponent(q)}`);
export const getMemberDetails = (groupId: string, memberId: string): Promise<any> => request(`/api/members/${memberId}?groupId=${groupId}`);
export const deleteMemberAccount = (groupId: string, memberId: string, token: string): Promise<any> => request(`/api/members/${memberId}`, 'DELETE', {groupId}, {'x-auth-token': token});
export const requestPasswordDeletion = (memberId: string, groupId: string): Promise<any> => request(`/api/members/${memberId}/request-password-deletion`, 'POST', {groupId});
export const generateUploadUrl = (memberId: string, fileType: string, fileHash: string, token: string): Promise<any> => request(`/api/members/${memberId}/generate-upload-url`, 'POST', {fileType, fileHash}, {'x-auth-token': token});
export const updateProfile = (memberId: string, profileData: any, groupId: string, token: string): Promise<any> => request(`/api/members/${memberId}/profile`, 'PUT', {...profileData, groupId}, {'x-auth-token': token});
export const setPassword = (memberId: string, password: string, groupId: string, token: string): Promise<any> => request(`/api/members/${memberId}/set-password`, 'POST', {password, groupId}, {'x-auth-token': token});
export const getPrizeMasters = (groupId: string): Promise<any> => request(`/api/groups/${groupId}/prize-masters`);
export const generatePrizeMasterUploadUrl = (groupId: string, fileType: string, fileHash: string): Promise<any> => request(`/api/groups/${groupId}/prize-masters/generate-upload-url`, 'POST', {fileType, fileHash});
export const addPrizeMaster = (groupId: string, name: string, imageUrl: string, rank: string): Promise<any> => request(`/api/groups/${groupId}/prize-masters`, 'POST', {name, imageUrl, rank});
export const deletePrizeMaster = (masterId: string, groupId: string): Promise<any> => request(`/api/prize-masters/${masterId}`, 'DELETE', {groupId});
export const requestAdminAccess = (): Promise<any> => request('/api/admin/request', 'POST');
export const getAdminRequests = (): Promise<any> => request('/api/admin/requests');
export const approveAdminRequest = (requestId: string): Promise<any> => request('/api/admin/approve', 'POST', {requestId});
export const getSystemAdmins = (lastVisible: string | null = null, searchId: string = ''): Promise<any> => {
  let endpoint = '/api/admin/system-admins';
  const params = new URLSearchParams();
  if (lastVisible) params.append('lastVisible', lastVisible);
  if (searchId) params.append('searchId', searchId);
  if (params.toString()) endpoint += `?${params.toString()}`;
  return request(endpoint);
};

export const getGroupAdmins = (lastVisible: string | null = null, searchId: string = ''): Promise<any> => {
  let endpoint = '/api/admin/group-admins';
  const params = new URLSearchParams();
  if (lastVisible) params.append('lastVisible', lastVisible);
  if (searchId) params.append('searchId', searchId);
  if (params.toString()) endpoint += `?${params.toString()}`;
  return request(endpoint);
};
export const demoteAdmin = (userId: string): Promise<any> => request('/api/admin/demote', 'POST', {userId});
export const impersonateUser = (targetUserId: string): Promise<any> => request('/api/admin/impersonate', 'POST', {targetUserId});
export const stopImpersonating = (): Promise<any> => request('/api/admin/stop-impersonating', 'POST');
export const getPasswordRequests = (groupId: string): Promise<any> => request(`/api/admin/groups/${groupId}/password-requests`);
export const approvePasswordReset = (memberId: string, groupId: string, requestId?: string): Promise<any> => request(`/api/admin/members/${memberId}/delete-password`, 'POST', {groupId, requestId});
export const logout = (): Promise<any> => request('/auth/logout', 'GET');
export const clearGroupVerification = (): Promise<any> => request('/auth/clear-group-verification', 'POST');

export const getMembers = (groupId: string): Promise<any> => request(`/api/groups/${groupId}/members`);
export const addMember = (groupId: string, name: string): Promise<any> => request(`/api/groups/${groupId}/members`, 'POST', {name});
export const updateMember = (groupId: string, memberId: string, data: any): Promise<any> => request(`/api/groups/${groupId}/members/${memberId}`, 'PUT', data);
export const deleteMember = (groupId: string, memberId: string): Promise<any> => request(`/api/groups/${groupId}/members/${memberId}`, 'DELETE');
export const regenerateLines = (eventId: string, deleteDoodles: boolean = false): Promise<any> => request(`/api/events/${eventId}/regenerate-lines`, 'POST', {deleteDoodles});
export const shufflePrizes = (eventId: string, shuffledPrizes: any[]): Promise<any> => request(`/api/events/${eventId}/shuffle-prizes`, 'POST', {shuffledPrizes});
export const acknowledgeResult = (eventId: string, memberId: string, token: string): Promise<any> => request(`/api/events/${eventId}/acknowledge-result`, 'POST', {memberId}, {'x-auth-token': token});

export const analyzeBulkMembers = (groupId: string, namesText: string): Promise<any> => request(`/api/groups/${groupId}/members/analyze-bulk`, 'POST', {namesText});
export const finalizeBulkMembers = (groupId: string, resolutions: any[]): Promise<any> => request(`/api/groups/${groupId}/members/finalize-bulk`, 'POST', {resolutions});

export const updateMemberStatus = (groupId: string, memberId: string, isActive: boolean): Promise<any> => request(`/api/groups/${groupId}/members/${memberId}/status`, 'PUT', {isActive});

export const getUnjoinedMembers = (groupId: string, eventId: string): Promise<any> => request(`/api/groups/${groupId}/unjoined-members?eventId=${eventId}`);
export const fillSlots = (eventId: string, assignments: any[]): Promise<any> => request(`/api/events/${eventId}/fill-slots`, 'POST', {assignments});

export const cleanupEvents = (groupId: string): Promise<any> => request(`/api/groups/${groupId}/cleanup-events`, 'POST'); // ★ 追加
export const adminRemoveParticipant = (eventId: string, slot: number): Promise<any> => request(`/api/events/${eventId}/participants/${slot}/admin-remove`, 'DELETE');
export const adminAddParticipant = (eventId: string, slot: number, memberId: string): Promise<any> => request(`/api/events/${eventId}/participants/${slot}/admin-add`, 'POST', { memberId });
