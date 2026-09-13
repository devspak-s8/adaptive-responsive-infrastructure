import { ProjectSettings } from './types';

export const DEFAULT_SETTINGS: ProjectSettings = {
  projectName: '',
  productionUrl: '',
  environment: 'Production',
  monitoringEnabled: true,
  autofixEnabled: false,
  automaticRollback: true,
  scanFrequency: 'continuous',
  notifyRegression: true,
  notifyCritical: true,
  notifyAutofix: false,
  protectionLevel: 'safe',
};
