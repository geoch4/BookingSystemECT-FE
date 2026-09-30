import client from './client';
import type { IntegrationReadinessDto } from '../types';

export const getIntegrationReadiness = () =>
  client.get<IntegrationReadinessDto>('/integrations/readiness').then((response) => response.data);
