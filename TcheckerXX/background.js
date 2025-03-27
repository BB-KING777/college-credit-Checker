// background.js - バックグラウンドサービスワーカー

// JSONファイルを読み込む関数
async function loadJsonFile(filename) {
  try {
    const url = chrome.runtime.getURL(`data/${filename}`);
    console.log(`ファイル読み込み試行: ${url}`);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`ファイル ${filename} の読み込みに失敗: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`${filename} の読み込み中にエラーが発生:`, error);
    throw error;
  }
}

// インストール時・更新時の初期化処理
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('単位チェッカーがインストールされました:', details.reason);
  
  // 初回インストール時のみウェルカムページを開く
  if (details.reason === 'install') {
    // Welcome.htmlを開く
    chrome.tabs.create({
      url: chrome.runtime.getURL('welcom.html')
    });
  }
  
  try {
    // 大学データを読み込む
    const ritsumeiAll = await loadJsonFile('RitsumeiAll.json');
    console.log('RitsumeiAll.jsonの読み込みに成功しました');
    
    // 必要なすべてのJSONファイルを取得
    const fileContents = {};
    const uniqueFiles = new Set();
    
    // すべての必要なファイルを収集
    ritsumeiAll.faculties.forEach(faculty => {
      faculty.departments.forEach(dept => {
        uniqueFiles.add(dept.requirementsFile);
        uniqueFiles.add(dept.courseCategoriesFile);
      });
    });
    
    console.log('読み込むファイル一覧:', Array.from(uniqueFiles));
    
    // ファイルの内容を順番に読み込む
    for (const filename of uniqueFiles) {
      try {
        fileContents[filename] = await loadJsonFile(filename);
        console.log(`${filename} の読み込みに成功しました`);
      } catch (error) {
        console.error(`${filename} の読み込みに失敗しました:`, error);
        // エラーが発生してもプロセスは続行するが、このファイルはスキップ
      }
    }
    
    // デフォルト選択値を設定
    const defaultFaculty = ritsumeiAll.faculties[0];
    const defaultDepartment = defaultFaculty.departments[0];
    const defaultCourse = defaultDepartment.hasCourses && defaultDepartment.courses.length > 0 
      ? defaultDepartment.courses[0].id 
      : null;
    
    // 設定を保存
    chrome.storage.local.set({
      ritsumeiAll,
      fileContents,
      selectedFaculty: defaultFaculty.id,
      selectedDepartment: defaultDepartment.id,
      selectedCourse: defaultCourse,
      autoAnalysis: true,
      lastCheckedDate: null,
      creditData: null,
      isFirstRun: details.reason === 'install' // 初回起動フラグを追加
    }, () => {
      if (chrome.runtime.lastError) {
        console.error('設定の保存中にエラーが発生しました:', chrome.runtime.lastError);
      } else {
        console.log('設定の初期化が完了しました');
      }
    });
  } catch (error) {
    console.error('設定の初期化中にエラーが発生しました:', error);
  }
});

// メッセージリスナー
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('メッセージを受信しました:', message);
  
  // データ取得リクエスト
  if (message.action === 'getCreditData') {
    chrome.storage.local.get(['creditData'], (result) => {
      if (chrome.runtime.lastError) {
        console.error('データ取得中にエラーが発生しました:', chrome.runtime.lastError);
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ success: true, data: result.creditData || null });
      }
    });
    return true; // 非同期レスポンスのために true を返す
  }
  
  // データ保存リクエスト
  else if (message.action === 'saveCreditData') {
    chrome.storage.local.set({ creditData: message.data }, () => {
      if (chrome.runtime.lastError) {
        console.error('データ保存中にエラーが発生しました:', chrome.runtime.lastError);
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ success: true });
      }
    });
    return true;
  }
  
  // ページタイプのチェックリクエスト
  else if (message.action === 'checkPageType') {
    // sender.tabが存在するか確認
    if (!sender || !sender.tab) {
      console.error('タブ情報が見つかりません');
      sendResponse({ success: false, error: 'タブ情報が見つかりません' });
      return true;
    }
    
    try {
      chrome.tabs.sendMessage(sender.tab.id, { action: 'getPageType' }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('コンテンツスクリプトとの通信エラー:', chrome.runtime.lastError);
          sendResponse({ 
            success: false, 
            error: chrome.runtime.lastError.message || 'コンテンツスクリプトとの通信に失敗しました' 
          });
        } else if (!response) {
          console.error('コンテンツスクリプトからの応答がありません');
          sendResponse({ success: false, error: '応答が受信できませんでした' });
        } else {
          console.log('ページタイプを取得しました:', response.pageType);
          sendResponse({ success: true, pageType: response.pageType });
        }
      });
    } catch (error) {
      console.error('メッセージ送信中にエラーが発生しました:', error);
      sendResponse({ success: false, error: error.message });
    }
    return true;
  }
  
  // 不明なアクション
  else {
    console.warn('不明なメッセージアクション:', message.action);
    sendResponse({ success: false, error: '不明なアクションです' });
    return false;
  }
});

console.log('バックグラウンドサービスワーカーが開始されました');