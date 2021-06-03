import { DenimRemoteDataSourceV2 } from 'denim';

const apiBaseUrl =
process.env.REACT_APP_API_BASE_URL || `${window.location.origin}/consumer`;
export const dataSource = new DenimRemoteDataSourceV2(apiBaseUrl);
