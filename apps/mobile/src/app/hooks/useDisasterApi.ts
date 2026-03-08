import {
  useAuthControllerSignIn,
  useAuthControllerSignUp,
  useAssistantControllerInquire,
  useFamiliesControllerCreateFamily,
  useFamiliesControllerGetMyFamilyMap,
  useFamiliesControllerJoinFamily,
  useHelpRequestsControllerClaim,
  useHelpRequestsControllerCreate,
  useHelpRequestsControllerMe,
  useHelpRequestsControllerUpdateStatus,
  useRiskIntelligenceControllerGetForecast,
  useRiskIntelligenceControllerGetUserImpact,
  useVolunteersControllerApply,
  useVolunteersControllerGetStatus,
  useWarningsControllerMe,
} from '@wira-borneo/api-client';

import { useAppState } from '../state/AppState';
import { readFamilyMapFromResponse, readWarningsFromResponse } from '../utils/dataAdapters';

export const useDisasterApi = () => {
  const { profile } = useAppState();

  const forecast = useRiskIntelligenceControllerGetForecast(
    {
      latitude: profile.location.latitude,
      longitude: profile.location.longitude,
      forecastDays: 3,
    },
    { query: { enabled: profile.isLoggedIn } },
  );

  const impact = useRiskIntelligenceControllerGetUserImpact({
    query: { enabled: profile.isLoggedIn },
  });

  const familyMap = useFamiliesControllerGetMyFamilyMap({
    query: { enabled: profile.isLoggedIn },
  });

  const warnings = useWarningsControllerMe({
    query: { enabled: profile.isLoggedIn, refetchInterval: 60_000 },
  });

  const volunteerStatus = useVolunteersControllerGetStatus({
    query: { enabled: profile.isLoggedIn, refetchInterval: 45_000 },
  });

  const myHelpRequests = useHelpRequestsControllerMe({
    query: { enabled: profile.isLoggedIn, refetchInterval: 20_000 },
  });

  return {
    queries: {
      forecast,
      impact,
      familyMap,
      warnings,
      volunteerStatus,
      myHelpRequests,
      warningItems: readWarningsFromResponse(warnings.data),
      familyMapItems: readFamilyMapFromResponse(familyMap.data),
    },
    mutations: {
      signIn: useAuthControllerSignIn(),
      signUp: useAuthControllerSignUp(),
      askAssistant: useAssistantControllerInquire(),
      createFamily: useFamiliesControllerCreateFamily(),
      joinFamily: useFamiliesControllerJoinFamily(),
      applyVolunteer: useVolunteersControllerApply(),
      createHelpRequest: useHelpRequestsControllerCreate(),
      claimHelpRequest: useHelpRequestsControllerClaim(),
      updateHelpStatus: useHelpRequestsControllerUpdateStatus(),
    },
  };
};
