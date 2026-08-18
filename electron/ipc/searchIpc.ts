import { ipcMain } from 'electron';
import { SearchService } from '../services/search/SearchService';
import { SearchResultItem } from '@shared/ipc-types';

export function registerSearchIpc(searchService: SearchService) {
  ipcMain.handle('search:query', async (_event, term: string): Promise<SearchResultItem[]> => {
    return searchService.query(term);
  });
}
