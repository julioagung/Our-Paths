/**
 * IndexedDB Usage Examples
 * 
 * File ini berisi contoh-contoh penggunaan IndexedDB Manager
 * untuk membantu developer memahami cara kerja sistem
 */

import dbManager from '../data/indexed-db.js';
import syncManager from '../data/sync-manager.js';

// ============================================
// EXAMPLE 1: Initialize Database
// ============================================
async function example1_InitializeDB() {
  console.log('=== Example 1: Initialize Database ===');
  
  try {
    await dbManager.init();
    console.log('✅ Database initialized successfully');
    
    const stats = await dbManager.getStats();
    console.log('📊 Database stats:', stats);
  } catch (error) {
    console.error('❌ Error initializing database:', error);
  }
}

// ============================================
// EXAMPLE 2: Save Single Story
// ============================================
async function example2_SaveStory() {
  console.log('=== Example 2: Save Single Story ===');
  
  const story = {
    id: 'story-123',
    name: 'John Doe',
    description: 'Amazing adventure in Bali',
    photoUrl: 'https://example.com/photo.jpg',
    createdAt: new Date().toISOString(),
    lat: -8.3405,
    lon: 115.0920
  };
  
  try {
    await dbManager.saveStory(story);
    console.log('✅ Story saved:', story.id);
  } catch (error) {
    console.error('❌ Error saving story:', error);
  }
}

// ============================================
// EXAMPLE 3: Save Multiple Stories (Bulk)
// ============================================
async function example3_SaveMultipleStories() {
  console.log('=== Example 3: Save Multiple Stories ===');
  
  const stories = [
    {
      id: 'story-1',
      name: 'Alice',
      description: 'Beach day',
      photoUrl: 'https://example.com/1.jpg',
      createdAt: new Date().toISOString()
    },
    {
      id: 'story-2',
      name: 'Bob',
      description: 'Mountain hiking',
      photoUrl: 'https://example.com/2.jpg',
      createdAt: new Date().toISOString()
    }
  ];
  
  try {
    await dbManager.saveStories(stories);
    console.log(`✅ Saved ${stories.length} stories`);
  } catch (error) {
    console.error('❌ Error saving stories:', error);
  }
}

// ============================================
// EXAMPLE 4: Read All Stories
// ============================================
async function example4_ReadAllStories() {
  console.log('=== Example 4: Read All Stories ===');
  
  try {
    const stories = await dbManager.getAllStories();
    console.log(`✅ Found ${stories.length} stories`);
    console.log('Stories:', stories);
  } catch (error) {
    console.error('❌ Error reading stories:', error);
  }
}

// ============================================
// EXAMPLE 5: Read Single Story
// ============================================
async function example5_ReadSingleStory() {
  console.log('=== Example 5: Read Single Story ===');
  
  const storyId = 'story-123';
  
  try {
    const story = await dbManager.getStory(storyId);
    if (story) {
      console.log('✅ Story found:', story);
    } else {
      console.log('⚠️ Story not found');
    }
  } catch (error) {
    console.error('❌ Error reading story:', error);
  }
}

// ============================================
// EXAMPLE 6: Delete Story
// ============================================
async function example6_DeleteStory() {
  console.log('=== Example 6: Delete Story ===');
  
  const storyId = 'story-123';
  
  try {
    await dbManager.deleteStory(storyId);
    console.log('✅ Story deleted:', storyId);
  } catch (error) {
    console.error('❌ Error deleting story:', error);
  }
}

// ============================================
// EXAMPLE 7: Search Stories
// ============================================
async function example7_SearchStories() {
  console.log('=== Example 7: Search Stories ===');
  
  const searchTerm = 'adventure';
  
  try {
    const results = await dbManager.searchStories(searchTerm);
    console.log(`✅ Found ${results.length} stories matching "${searchTerm}"`);
    console.log('Results:', results);
  } catch (error) {
    console.error('❌ Error searching stories:', error);
  }
}

// ============================================
// EXAMPLE 8: Filter Stories by Location
// ============================================
async function example8_FilterByLocation() {
  console.log('=== Example 8: Filter by Location ===');
  
  try {
    const withLocation = await dbManager.filterStoriesByLocation('with-location');
    console.log(`✅ Stories with location: ${withLocation.length}`);
    
    const withoutLocation = await dbManager.filterStoriesByLocation('no-location');
    console.log(`✅ Stories without location: ${withoutLocation.length}`);
  } catch (error) {
    console.error('❌ Error filtering stories:', error);
  }
}

// ============================================
// EXAMPLE 9: Sort Stories
// ============================================
async function example9_SortStories() {
  console.log('=== Example 9: Sort Stories ===');
  
  try {
    const newest = await dbManager.sortStories('newest');
    console.log('✅ Sorted by newest:', newest.length);
    
    const oldest = await dbManager.sortStories('oldest');
    console.log('✅ Sorted by oldest:', oldest.length);
    
    const byName = await dbManager.sortStories('name');
    console.log('✅ Sorted by name:', byName.length);
  } catch (error) {
    console.error('❌ Error sorting stories:', error);
  }
}

// ============================================
// EXAMPLE 10: Combined Query (Search + Filter + Sort)
// ============================================
async function example10_CombinedQuery() {
  console.log('=== Example 10: Combined Query ===');
  
  try {
    const results = await dbManager.queryStories({
      searchTerm: 'beach',
      locationFilter: 'with-location',
      sortBy: 'newest'
    });
    
    console.log(`✅ Found ${results.length} stories`);
    console.log('Criteria: search="beach", location=with, sort=newest');
    console.log('Results:', results);
  } catch (error) {
    console.error('❌ Error querying stories:', error);
  }
}

// ============================================
// EXAMPLE 11: Save Story Offline
// ============================================
async function example11_SaveOfflineStory() {
  console.log('=== Example 11: Save Story Offline ===');
  
  const offlineStory = {
    description: 'Created while offline',
    photoBlob: new Blob(['fake photo data'], { type: 'image/jpeg' }),
    lat: -6.2,
    lon: 106.816666
  };
  
  try {
    const result = await syncManager.saveStoryOffline(offlineStory);
    console.log('✅ Story saved offline:', result);
  } catch (error) {
    console.error('❌ Error saving offline story:', error);
  }
}

// ============================================
// EXAMPLE 12: Get Pending Stories
// ============================================
async function example12_GetPendingStories() {
  console.log('=== Example 12: Get Pending Stories ===');
  
  try {
    const pending = await dbManager.getPendingStories();
    console.log(`✅ Found ${pending.length} pending stories`);
    console.log('Pending:', pending);
  } catch (error) {
    console.error('❌ Error getting pending stories:', error);
  }
}

// ============================================
// EXAMPLE 13: Manual Sync
// ============================================
async function example13_ManualSync() {
  console.log('=== Example 13: Manual Sync ===');
  
  try {
    if (!navigator.onLine) {
      console.log('⚠️ Device is offline, cannot sync');
      return;
    }
    
    await syncManager.manualSync();
    console.log('✅ Sync completed');
  } catch (error) {
    console.error('❌ Error syncing:', error);
  }
}

// ============================================
// EXAMPLE 14: Get Sync Status
// ============================================
async function example14_GetSyncStatus() {
  console.log('=== Example 14: Get Sync Status ===');
  
  try {
    const status = await syncManager.getSyncStatus();
    console.log('✅ Sync status:', status);
    console.log('  - Online:', status.isOnline);
    console.log('  - Syncing:', status.isSyncing);
    console.log('  - Pending stories:', status.pendingStories);
    console.log('  - Cached stories:', status.cachedStories);
  } catch (error) {
    console.error('❌ Error getting sync status:', error);
  }
}

// ============================================
// EXAMPLE 15: Listen to Sync Events
// ============================================
function example15_ListenToSyncEvents() {
  console.log('=== Example 15: Listen to Sync Events ===');
  
  const syncListener = (event) => {
    console.log('🔔 Sync event:', event.type);
    
    switch (event.type) {
      case 'sync-start':
        console.log('  → Sync started');
        break;
      case 'sync-progress':
        console.log(`  → Progress: ${event.current}/${event.total}`);
        break;
      case 'sync-complete':
        if (event.success) {
          console.log(`  → Success! Synced ${event.synced} stories`);
        } else {
          console.log(`  → Failed: ${event.error}`);
        }
        break;
    }
  };
  
  syncManager.addSyncListener(syncListener);
  console.log('✅ Sync listener added');
  
  // To remove listener later:
  // syncManager.removeSyncListener(syncListener);
}

// ============================================
// EXAMPLE 16: Clear All Cache
// ============================================
async function example16_ClearCache() {
  console.log('=== Example 16: Clear All Cache ===');
  
  try {
    await dbManager.clearAllStories();
    console.log('✅ Cache cleared');
  } catch (error) {
    console.error('❌ Error clearing cache:', error);
  }
}

// ============================================
// EXAMPLE 17: Get Database Statistics
// ============================================
async function example17_GetStats() {
  console.log('=== Example 17: Get Database Statistics ===');
  
  try {
    const stats = await dbManager.getStats();
    console.log('✅ Database statistics:');
    console.log('  - Total stories:', stats.totalStories);
    console.log('  - Stories with location:', stats.storiesWithLocation);
    console.log('  - Pending stories:', stats.pendingStories);
    console.log('  - Pending sync ops:', stats.pendingSyncOperations);
    console.log('  - Last updated:', new Date(stats.lastUpdated).toLocaleString());
  } catch (error) {
    console.error('❌ Error getting stats:', error);
  }
}

// ============================================
// EXAMPLE 18: Complete Workflow
// ============================================
async function example18_CompleteWorkflow() {
  console.log('=== Example 18: Complete Workflow ===');
  
  try {
    // 1. Initialize
    await dbManager.init();
    console.log('✅ Step 1: Database initialized');
    
    // 2. Save stories
    const stories = [
      {
        id: 'demo-1',
        name: 'Demo User',
        description: 'Demo story 1',
        photoUrl: 'https://example.com/demo1.jpg',
        createdAt: new Date().toISOString(),
        lat: -6.2,
        lon: 106.8
      },
      {
        id: 'demo-2',
        name: 'Demo User',
        description: 'Demo story 2',
        photoUrl: 'https://example.com/demo2.jpg',
        createdAt: new Date().toISOString()
      }
    ];
    await dbManager.saveStories(stories);
    console.log('✅ Step 2: Stories saved');
    
    // 3. Query stories
    const results = await dbManager.queryStories({
      searchTerm: 'demo',
      locationFilter: 'all',
      sortBy: 'newest'
    });
    console.log(`✅ Step 3: Found ${results.length} stories`);
    
    // 4. Get stats
    const stats = await dbManager.getStats();
    console.log('✅ Step 4: Stats retrieved:', stats);
    
    // 5. Check sync status
    const syncStatus = await syncManager.getSyncStatus();
    console.log('✅ Step 5: Sync status:', syncStatus);
    
    console.log('🎉 Complete workflow finished!');
  } catch (error) {
    console.error('❌ Error in workflow:', error);
  }
}

// ============================================
// RUN ALL EXAMPLES
// ============================================
export async function runAllExamples() {
  console.log('🚀 Running all IndexedDB examples...\n');
  
  await example1_InitializeDB();
  await example2_SaveStory();
  await example3_SaveMultipleStories();
  await example4_ReadAllStories();
  await example5_ReadSingleStory();
  await example6_DeleteStory();
  await example7_SearchStories();
  await example8_FilterByLocation();
  await example9_SortStories();
  await example10_CombinedQuery();
  await example11_SaveOfflineStory();
  await example12_GetPendingStories();
  await example13_ManualSync();
  await example14_GetSyncStatus();
  example15_ListenToSyncEvents();
  await example16_ClearCache();
  await example17_GetStats();
  await example18_CompleteWorkflow();
  
  console.log('\n✅ All examples completed!');
}

// Export individual examples
export {
  example1_InitializeDB,
  example2_SaveStory,
  example3_SaveMultipleStories,
  example4_ReadAllStories,
  example5_ReadSingleStory,
  example6_DeleteStory,
  example7_SearchStories,
  example8_FilterByLocation,
  example9_SortStories,
  example10_CombinedQuery,
  example11_SaveOfflineStory,
  example12_GetPendingStories,
  example13_ManualSync,
  example14_GetSyncStatus,
  example15_ListenToSyncEvents,
  example16_ClearCache,
  example17_GetStats,
  example18_CompleteWorkflow
};

// Usage in browser console:
// import { runAllExamples } from './src/scripts/examples/indexeddb-usage-example.js';
// runAllExamples();
