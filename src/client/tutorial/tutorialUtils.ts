import { TutorialStory } from './tutorialData';

const viewToUrlMap: Record<string, string | ((groupId: string) => string)> = {
  groupDashboard: '/admin/groups',
  dashboardView: (groupId: string) => `/admin/groups/${groupId}`,
  eventEditView: (groupId: string) => `/admin/group/${groupId}/event/new`,
};

export const generateTutorialUrl = (tutorial: TutorialStory, state: any): string => {
  const targetView = tutorial.steps[0]?.match;
  const urlBuilder = targetView ? viewToUrlMap[targetView] : undefined;

  if (urlBuilder) {
    let baseUrl: string;
    if (typeof urlBuilder === 'function') {
      const groupId = state.currentGroupId || (state.currentUser && state.currentUser.lastUsedGroupId);
      if (groupId) {
        baseUrl = urlBuilder(groupId);
      } else {
        return '#NO_GROUP';
      }
    } else {
      baseUrl = urlBuilder;
    }
    return `${baseUrl}?forceTutorial=${encodeURIComponent(tutorial.id)}`;
  }

  // Fallback
  const groupId = state.currentGroupId || (state.currentUser && state.currentUser.lastUsedGroupId);
  return groupId 
    ? `/admin/groups/${groupId}?forceTutorial=${tutorial.id}` 
    : `/admin/groups?forceTutorial=${tutorial.id}`;
};
