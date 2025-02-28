// content.js - キャンパスウェブのページで実行されるスクリプト

// ======= 初期化関数 =======
/*
// 初期化
function initialize() {
  console.log("単位チェッカー拡張機能を初期化します");
  
  // メッセージリスナーの設定
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("メッセージを受信:", message);
    
    // ページタイプ取得リクエスト
    if (message.action === 'getPageType') {
      sendResponse({ pageType: getCurrentPageType() });
      return;
    }
    
    // 単位チェックリクエスト
    if (message.action === 'checkCredits') {
      handleCreditCheck(message, sendResponse);
      return true; // 非同期レスポンスを示す
    }
    
    // 詳細な推奨科目表示リクエスト
    if (message.action === 'showDetailedRecommendations') {
      showDetailedRecommendations();
      return;
    }
  });
  
  // 推奨科目がない場合
  if (!hasRecommendations) {
    const noRecommendations = document.createElement('div');
    noRecommendations.style.cssText = `
      padding: 20px;
      background-color: #e8f5e9;
      border: 1px solid #c8e6c9;
      border-radius: 5px;
      text-align: center;
      margin-bottom: 20px;
    `;
    noRecommendations.innerHTML = `
      <h3 style="margin-top: 0; color: #2e7d32; font-size: 18px;">推奨科目はありません</h3>
      <p>卒業要件を満たしているため、特に推奨科目はありません。</p>
      <p>その他の履修科目は履修要項を確認してください。</p>
    `;
    recommendationsSection.appendChild(noRecommendations);
  }
  
  container.appendChild(recommendationsSection);
  
  // 履修アドバイス
  const adviceSection = document.createElement('div');
  adviceSection.style.cssText = `
    margin-top: 20px;
    padding: 15px;
    background-color: #e3f2fd;
    border: 1px solid #bbdefb;
    border-radius: 5px;
  `;
  
  adviceSection.innerHTML = `
    <h3 style="margin-top: 0; color: #0d47a1; font-size: 18px;">履修アドバイス</h3>
    <ul>
      <li>必修科目は必ず優先して履修してください。</li>
      <li>不足している区分の単位を優先的に取得してください。</li>
      <li>セメスター毎の履修上限単位数を確認し、バランスよく履修計画を立ててください。</li>
      <li>科目の前提条件（履修条件）を必ず確認してください。</li>
      <li>不明点は学部事務室や教務課に相談することをお勧めします。</li>
    </ul>
  `;
  container.appendChild(adviceSection);
  
  // 閉じるボタン
  const closeButton = document.createElement('button');
  closeButton.style.cssText = `
    display: block;
    width: 100%;
    background-color: #006699;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 10px;
    cursor: pointer;
    font-weight: bold;
    margin-top: 20px;
  `;
  closeButton.textContent = '閉じる';
  closeButton.addEventListener('click', () => container.remove());
  container.appendChild(closeButton);
  
  // ページに追加
  document.body.appendChild(container);
}*/

// 初期化
// 初期化
function initialize() {
  console.log("単位チェッカー拡張機能を初期化します");
  
  // ページタイプを即時確認
  const currentPageType = getCurrentPageType();
  console.log("現在のページタイプ:", currentPageType);
  
  // メッセージリスナーの設定
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("メッセージを受信:", message);
    
    // ページタイプ取得リクエスト
    if (message.action === 'getPageType') {
      sendResponse({ pageType: getCurrentPageType() });
      return;
    }
    
    // 単位チェックリクエスト
    if (message.action === 'checkCredits') {
      handleCreditCheck(message, sendResponse);
      return true; // 非同期レスポンスを示す
    }
    
    // 詳細な推奨科目表示リクエスト
    if (message.action === 'showDetailedRecommendations') {
      showDetailedRecommendations();
      return;
    }
  });
  
  // 科目一覧ページの場合、分析ボタンを表示
  if (currentPageType === 'course-list') {
    console.log("科目一覧ページを検出しました。自動分析の準備をします。");
    // 自動分析の設定を確認
    chrome.storage.local.get(['autoAnalysis'], (result) => {
      if (result.autoAnalysis !== false) {
        console.log("自動分析が有効です。分析ボタンを表示します。");
        setTimeout(createAnalysisButton, 500); // DOMが完全に読み込まれるのを待つ
      } else {
        console.log("自動分析は無効です。手動操作が必要です。");
        createAnalysisButton(); // 分析ボタンは常に表示
      }
    });
  } else {
    console.log("科目一覧ページではありません。ページタイプ:", currentPageType);
  }
  
  // ページ変更の監視を設定
  watchPageChanges();
  
  // ページ読み込み完了時の処理
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onPageLoaded);
  } else {
    onPageLoaded();
  }
  
  console.log("単位チェッカー拡張機能の初期化が完了しました");
}

// ページ内容の変更を監視
function watchPageChanges() {
  const observer = new MutationObserver((mutations) => {
    // 何らかの大きな変更があった場合、ページタイプを再確認
    const significantChanges = mutations.some(mutation => 
      mutation.addedNodes.length > 5 || 
      (mutation.type === 'childList' && mutation.target.tagName === 'TABLE')
    );
    
    if (significantChanges) {
      console.log("ページ内容が大きく変更されました");
      const pageType = getCurrentPageType();
      
      if (pageType === 'course-list') {
        console.log("科目一覧ページが検出されました（動的更新）");
        // 既存のボタンがなければ作成
        const existingButton = document.getElementById('credit-checker-button');
        if (!existingButton) {
          createAnalysisButton();
        }
      }
    }
  });
  
  // ページ全体の変更を監視
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: false,
    characterData: false
  });
  
  console.log("ページ変更の監視を開始しました");
}

// 詳細な推奨科目表示機能
// 詳細な推奨科目表示機能
function showDetailedRecommendations() {
  // 現在のデータを取得
  chrome.storage.local.get(['creditData'], async (result) => {
    if (!result.creditData) {
      alert('単位データが見つかりません。先に単位チェックを実行してください。');
      return;
    }
    
    try {
      const settings = await getCurrentSettings();
      
      // 科目データの取得
      const courseData = extractCourseData();
      if (!courseData || !courseData.courses) {
        alert('表示されている科目データを取得できませんでした。');
        return;
      }
      
      const { credits, graduationCheck, recommendations } = result.creditData;
      
      // JSONファイルから推奨科目を生成
      const latestRecommendations = await generateRecommendations(
        credits, 
        graduationCheck, 
        settings,
        null // 現在表示中の科目でフィルタリングしないためnullを渡す
      );
      
      // 詳細な推奨科目表示UIを作成
      createDetailedRecommendationsUI(credits, graduationCheck, settings, latestRecommendations);
    } catch (error) {
      console.error('推奨科目表示中にエラーが発生:', error);
      alert('推奨科目表示中にエラーが発生しました: ' + error.message);
    }
  });
}

/*
// 初期化実行
initialize();
  
  // 推奨科目がない場合
  if (!hasAnyRecommendations) {
    const noRecommendations = document.createElement('p');
    noRecommendations.style.cssText = `
      padding: 15px;
      background-color: #e8f5e9;
      border: 1px solid #c8e6c9;
      border-radius: 5px;
      text-align: center;
      margin-top: 15px;
    `;
    noRecommendations.textContent = '卒業要件を満たしているため、特に推奨科目はありません。';
    recommendationsSection.appendChild(noRecommendations);
  }
  
  container.appendChild(recommendationsSection);
  
  // 卒業要件セクション
  const gradSection = document.createElement('div');
  gradSection.style.cssText = `margin-bottom: 25px;`;
  
  // タイトル
  const gradTitle = document.createElement('h3');
  gradTitle.style.cssText = `
    margin-top: 0;
    color: #333;
    border-left: 4px solid #006699;
    padding-left: 10px;
    font-size: 18px;
  `;
  gradTitle.textContent = '卒業要件充足状況';
  gradSection.appendChild(gradTitle);
  
  // 要件ステータス
  const gradStatus = document.createElement('div');
  gradStatus.style.cssText = `
    padding: 15px;
    border-radius: 5px;
    margin-top: 10px;
    text-align: center;
    font-weight: bold;
    font-size: 16px;
    ${graduationCheck.fulfilled ? 
      'background-color: #e8f5e9; color: #2e7d32; border: 1px solid #c8e6c9;' : 
      'background-color: #ffebee; color: #c62828; border: 1px solid #ffcdd2;'}
  `;
  gradStatus.textContent = graduationCheck.fulfilled ? 
                          '卒業要件を満たしています' : 
                          '卒業要件を満たしていません';
  gradSection.appendChild(gradStatus);
  
  container.appendChild(gradSection);
  
  // 詳細ボタン
  const detailButton = document.createElement('button');
  detailButton.style.cssText = `
    display: block;
    width: 100%;
    background-color: #2196F3;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 10px;
    cursor: pointer;
    font-weight: bold;
    margin-top: 20px;
    margin-bottom: 10px;
  `;
  detailButton.textContent = '詳細な科目一覧を見る';
  detailButton.addEventListener('click', () => {
    container.remove();
    showDetailedRecommendations();
  });
  container.appendChild(detailButton);
  
  // 免責事項
  const disclaimer = document.createElement('div');
  disclaimer.style.cssText = `
    margin-top: 10px;
    padding: 10px;
    background-color: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 4px;
    font-size: 12px;
    color: #666;
  `;
  disclaimer.innerHTML = `
    <p>※このツールは参考用です。正確な履修・卒業要件については必ず大学の公式情報を確認してください。</p>
    <p>最終更新: ${new Date().toLocaleString()}</p>
  `;
  container.appendChild(disclaimer);
  
  // 閉じるボタン
  const closeButton = document.createElement('button');
  closeButton.style.cssText = `
    display: block;
    width: 100%;
    background-color: #006699;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 10px;
    cursor: pointer;
    font-weight: bold;
    margin-top: 10px;
  `;
  closeButton.textContent = '閉じる';
  closeButton.addEventListener('click', () => container.remove());
  container.appendChild(closeButton);
  
  // ページに追加
  document.body.appendChild(container);*/


// 詳細な推奨科目表示UI
// 詳細な推奨科目表示UI
function createDetailedRecommendationsUI(credits, graduationCheck, settings, recommendations) {
  // 既存のUI要素を削除
  const existingUI = document.getElementById('recommendations-detail');
  if (existingUI) {
    existingUI.remove();
  }
  
  // メインコンテナ
  const container = document.createElement('div');
  container.id = 'recommendations-detail';
  container.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 80%;
    max-width: 800px;
    max-height: 90vh;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    z-index: 10001;
    padding: 20px;
    overflow-y: auto;
  `;
  
  // ヘッダー
  const header = document.createElement('div');
  header.style.cssText = `
    border-bottom: 2px solid #006699;
    margin-bottom: 20px;
    padding-bottom: 10px;
    text-align: center;
  `;
  header.innerHTML = `<h2 style="margin: 0; color: #006699; font-size: 22px;">推奨科目一覧</h2>`;
  container.appendChild(header);
  
  // 不足単位情報
  const missingSection = document.createElement('div');
  missingSection.style.cssText = `margin-bottom: 20px;`;
  
  let missingHTML = '<h3 style="margin-top: 0; color: #333; border-left: 4px solid #006699; padding-left: 10px; font-size: 18px;">不足単位</h3>';
  
  if (graduationCheck.fulfilled) {
    missingHTML += `
      <p style="padding: 10px; background-color: #e8f5e9; border: 1px solid #c8e6c9; border-radius: 5px; text-align: center;">
        卒業に必要な全ての単位要件を満たしています。
      </p>
    `;
  } else {
    missingHTML += '<ul style="margin-top: 10px;">';
    
    // 不足している区分を表示
    if (graduationCheck.missing.foreignLanguage > 0) {
      missingHTML += `<li><strong>外国語科目:</strong> あと${graduationCheck.missing.foreignLanguage}単位必要</li>`;
    }
    
    if (graduationCheck.missing.generalEducation > 0) {
      missingHTML += `<li><strong>教養科目:</strong> あと${graduationCheck.missing.generalEducation}単位必要</li>`;
    }
    
    if (graduationCheck.missing.specializedBasic > 0) {
      missingHTML += `<li><strong>基礎専門科目:</strong> あと${graduationCheck.missing.specializedBasic}単位必要</li>`;
    }
    
    if (graduationCheck.missing.specializedCommon > 0) {
      missingHTML += `<li><strong>共通専門科目:</strong> あと${graduationCheck.missing.specializedCommon}単位必要</li>`;
    }
    
    if (graduationCheck.missing.specializedCore > 0) {
      missingHTML += `<li><strong>固有専門科目:</strong> あと${graduationCheck.missing.specializedCore}単位必要</li>`;
    }
    
    if (graduationCheck.missing.totalSpecialized > 0) {
      missingHTML += `<li><strong>専門科目合計:</strong> あと${graduationCheck.missing.totalSpecialized}単位必要</li>`;
    }
    
    if (graduationCheck.missing.total > 0) {
      missingHTML += `<li><strong>総単位数:</strong> あと${graduationCheck.missing.total}単位必要</li>`;
    }
    
    missingHTML += '</ul>';
  }
  
  missingSection.innerHTML = missingHTML;
  container.appendChild(missingSection);
  
  // 推奨科目セクション
  const recommendationsSection = document.createElement('div');
  recommendationsSection.style.cssText = `margin-bottom: 20px;`;
  
  // 推奨科目タイトル
  const recomTitle = document.createElement('h3');
  recomTitle.style.cssText = `
    margin-top: 0;
    color: #333;
    border-left: 4px solid #006699;
    padding-left: 10px;
    font-size: 18px;
    margin-bottom: 15px;
  `;
  recomTitle.textContent = 'カテゴリ別推奨科目';
  recommendationsSection.appendChild(recomTitle);
  
  let hasRecommendations = false;
  
  // 必修科目の推奨
  if (recommendations && recommendations.required && recommendations.required.length > 0) {
    hasRecommendations = true;
    const requiredSection = document.createElement('div');
    requiredSection.style.cssText = `
      margin-bottom: 20px;
      padding: 15px;
      background-color: #fff8e1;
      border: 1px solid #ffe082;
      border-radius: 5px;
    `;
    
    let requiredHTML = `
      <h3 style="margin-top: 0; color: #ff8f00; font-size: 18px;">必修科目</h3>
      <p style="margin-bottom: 10px;">以下の必修科目を優先的に履修することを推奨します：</p>
      <ul>
    `;
    
    recommendations.required.forEach(course => {
      requiredHTML += `<li>${course}</li>`;
    });
    
    requiredHTML += '</ul>';
    requiredSection.innerHTML = requiredHTML;
    recommendationsSection.appendChild(requiredSection);
  }
  
  // カテゴリ別推奨科目
  const categories = [
    { id: 'specializedCore', name: '専門科目', description: '専門性を高めるための科目です。', bgColor: '#e8f5e9', borderColor: '#c8e6c9', titleColor: '#2e7d32' },
    { id: 'specializedCommon', name: '共通専門科目', description: '学科共通の専門知識を学ぶ科目です。', bgColor: '#e3f2fd', borderColor: '#bbdefb', titleColor: '#1565c0' },
    { id: 'specializedBasic', name: '基礎専門科目', description: '専門分野の基礎となる科目です。', bgColor: '#e8eaf6', borderColor: '#c5cae9', titleColor: '#3949ab' },
    { id: 'generalEducation', name: '教養科目', description: '幅広い知識を身につけるための科目です。', bgColor: '#f9fbe7', borderColor: '#f0f4c3', titleColor: '#827717' },
    { id: 'foreignLanguage', name: '外国語科目', description: '語学力を高めるための科目です。', bgColor: '#fff3e0', borderColor: '#ffe0b2', titleColor: '#e65100' }
  ];
  
  categories.forEach(category => {
    if (recommendations && recommendations[category.id] && recommendations[category.id].length > 0) {
      hasRecommendations = true;
      const categorySection = document.createElement('div');
      categorySection.style.cssText = `
        margin-bottom: 20px;
        padding: 15px;
        background-color: ${category.bgColor};
        border: 1px solid ${category.borderColor};
        border-radius: 5px;
      `;
      
      let categoryHTML = `
        <h3 style="margin-top: 0; color: ${category.titleColor}; font-size: 18px;">${category.name}</h3>
        <p style="margin-bottom: 10px;">${category.description}</p>
        <p style="margin-bottom: 10px;">以下の科目の履修を検討してください：</p>
        <ul>
      `;
      
      recommendations[category.id].forEach(course => {
        categoryHTML += `<li>${course}</li>`;
      });
      
      categoryHTML += '</ul>';
      
      // 更新した注記（JSONファイルから情報を取得している旨）
      categoryHTML += `
        <p style="margin-top: 15px; font-size: 12px; color: #666;">
          ※ この推奨科目リストはJSONファイルに登録されている全科目から選択しています。現在の学期に開講していない科目も含まれる場合があります。
        </p>
      `;
      
      categorySection.innerHTML = categoryHTML;
      recommendationsSection.appendChild(categorySection);
    }
  });
  
  // 推奨科目がない場合
  if (!hasRecommendations) {
    const noRecommendations = document.createElement('div');
    noRecommendations.style.cssText = `
      padding: 20px;
      background-color: #e8f5e9;
      border: 1px solid #c8e6c9;
      border-radius: 5px;
      text-align: center;
      margin-bottom: 20px;
    `;
    noRecommendations.innerHTML = `
      <h3 style="margin-top: 0; color: #2e7d32; font-size: 18px;">推奨科目はありません</h3>
      <p>卒業要件を満たしているため、特に推奨科目はありません。</p>
      <p>その他の履修科目は履修要項を確認してください。</p>
    `;
    recommendationsSection.appendChild(noRecommendations);
  }
  
  container.appendChild(recommendationsSection);
  
  // 履修アドバイス
  const adviceSection = document.createElement('div');
  adviceSection.style.cssText = `
    margin-top: 20px;
    padding: 15px;
    background-color: #e3f2fd;
    border: 1px solid #bbdefb;
    border-radius: 5px;
  `;
  
  adviceSection.innerHTML = `
    <h3 style="margin-top: 0; color: #0d47a1; font-size: 18px;">履修アドバイス</h3>
    <ul>
      <li>必修科目は必ず優先して履修してください。</li>
      <li>不足している区分の単位を優先的に取得してください。</li>
      <li>セメスター毎の履修上限単位数を確認し、バランスよく履修計画を立ててください。</li>
      <li>科目の前提条件（履修条件）を必ず確認してください。</li>
      <li>不明点は学部事務室や教務課に相談することをお勧めします。</li>
    </ul>
  `;
  container.appendChild(adviceSection);
  
  // 閉じるボタン
  const closeButton = document.createElement('button');
  closeButton.style.cssText = `
    display: block;
    width: 100%;
    background-color: #006699;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 10px;
    cursor: pointer;
    font-weight: bold;
    margin-top: 20px;
  `;
  closeButton.textContent = '閉じる';
  closeButton.addEventListener('click', () => container.remove());
  container.appendChild(closeButton);
  
  // ページに追加
  document.body.appendChild(container);
}

// ページロード完了時の処理
// ページロード完了時の処理
function onPageLoaded() {
  console.log("ページロード完了");
  
  // 自動分析の実行
  chrome.storage.local.get(['autoAnalysis'], (result) => {
    if (result.autoAnalysis !== false && getCurrentPageType() === 'course-list') {
      console.log("自動分析を実行します");
      // UIボタン要素を表示
      createAnalysisButton();
    }
  });
}

// 現在のページタイプを判定する関数
function getCurrentPageType() {
  console.log("ページタイプの判定を開始します");
  
  // ページのタイトル要素をチェック - より広範囲なセレクタを使用
  const titleElements = document.querySelectorAll('h1, div.title, div.subwin_title, .title_subwin_title, .txt_subwin_title, .subwin_title');
  
  for (const el of titleElements) {
    // テキストコンテンツを取得し、imgタグがある場合はaltやその他の情報も確認
    let titleText = el.textContent || '';
    const imgElement = el.querySelector('img');
    
    console.log("検出されたタイトル要素:", titleText, el);
    
    if (titleText.includes('科目一覧') || 
        titleText.includes('履修状況確認') || 
        (el.innerHTML && el.innerHTML.includes('科目一覧'))) {
      console.log("科目一覧/履修状況確認のタイトルを検出しました:", titleText);
      return 'course-list';
    }
  }
  
  // コース表テーブルのより詳細な検出
  const tables = document.querySelectorAll('table.result_title, table[width*="100%"], .result_list table');
  if (tables.length > 0) {
    console.log("潜在的な科目テーブルを検出:", tables.length, "個");
    
    for (const table of tables) {
      // テーブルの内容をデバッグ出力
      console.log("テーブル構造:", table.outerHTML.substring(0, 200) + "...");
      
      const headers = table.querySelectorAll('th');
      const headerTexts = Array.from(headers).map(h => h.textContent || '');
      console.log("テーブルヘッダー:", headerTexts);
      
      // より広範囲なキーワードで科目テーブルを検出
      const relevantHeaders = ['科目', '区分', '単位', '成績', '担当者', '開講', 'クラス'];
      const hasRelevantHeaders = headerTexts.some(text => 
        relevantHeaders.some(keyword => text.includes(keyword))
      );
      
      if (hasRelevantHeaders || headerTexts.length >= 5) {
        console.log("科目関連のテーブルヘッダーを検出しました");
        return 'course-list';
      }
      
      // ヘッダーがなくても行数が多い場合は科目テーブルと判断
      const rows = table.querySelectorAll('tr');
      if (rows.length > 10) {
        console.log("多数の行を持つテーブルを検出したため科目テーブルと判断:", rows.length);
        return 'course-list';
      }
    }
  }
  
  // ページ内のテキストで科目一覧を検出
  const pageText = document.body.textContent || '';
  if (pageText.includes('科目一覧') && 
      (pageText.includes('単位数') || pageText.includes('成績評価'))) {
    console.log("ページテキストから科目一覧ページと判断");
    return 'course-list';
  }
  
  // URLで判定を試みる
  const url = window.location.href;
  if (url.includes('campusweb') && 
      (url.includes('rishu') || url.includes('credit') || url.includes('status'))) {
    console.log("URLパターンから科目一覧ページと判断");
    return 'course-list';
  }
  
  // 特定の構造をチェック（CAMPUS WEBの特徴的な要素）
  if (document.querySelector('.result_list') || 
      document.querySelector('.infoheader_hl') || 
      document.querySelector('.personal_area')) {
    console.log("CAMPUS WEBの特徴的な要素を検出");
    
    // 科目テーブルらしき要素をさらに広く検索
    const potentialTables = document.querySelectorAll('table');
    for (const table of potentialTables) {
      const cells = table.querySelectorAll('td');
      if (cells.length > 20) {  // 一定数以上のセルがあればデータテーブルと判断
        console.log("データテーブルを検出したため科目一覧と判断:", cells.length);
        return 'course-list';
      }
    }
  }
  
  console.log("科目一覧ページとして認識できませんでした");
  return 'unknown';
}


// ======= データ処理関数 =======

// 単位チェック処理を実行
async function handleCreditCheck(message, sendResponse) {
  try {
    // 科目データの取得
    const courseData = extractCourseData();
    if (!courseData || !courseData.courses || courseData.courses.length === 0) {
      sendResponse({ success: false, message: '科目データを取得できませんでした' });
      return;
    }
    
    // 学部・学科情報の取得
    const facultyId = message.faculty;
    const departmentId = message.department;
    const courseId = message.course;
    
    // 設定情報を取得
    const settings = await getSettings(facultyId, departmentId);
    if (!settings) {
      sendResponse({ success: false, message: '設定情報を取得できませんでした' });
      return;
    }
    
    // 科目カテゴリ割り当て
    const creditsData = await calculateCredits(courseData.courses, settings, courseId);
    
    // 卒業要件チェック
    const graduationCheck = await checkGraduationRequirements(creditsData, settings.requirements);
    
    // 推奨科目の生成
    const recommendations = await generateRecommendations(creditsData, graduationCheck, settings, courseData.courses);
    
    // レスポンス送信
    sendResponse({ 
      success: true, 
      data: {
        credits: creditsData,
        graduationCheck,
        requirements: settings.requirements.common,
        recommendations
      }
    });
  } catch (error) {
    console.error('単位チェック処理でエラーが発生:', error);
    sendResponse({ success: false, message: error.toString() });
  }
}

// 現在の設定を取得
function getCurrentSettings() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(
      ['selectedFaculty', 'selectedDepartment', 'selectedCourse', 'ritsumeiAll', 'fileContents'],
      (result) => {
        try {
          const facultyId = result.selectedFaculty;
          const departmentId = result.selectedDepartment;
          const courseId = result.selectedCourse;
          
          if (!result.ritsumeiAll || !result.fileContents) {
            reject(new Error('設定データが見つかりません'));
            return;
          }
          
          // 学部・学科を検索
          const faculty = result.ritsumeiAll.faculties.find(f => f.id === facultyId);
          if (!faculty) {
            reject(new Error('選択された学部が見つかりません'));
            return;
          }
          
          const department = faculty.departments.find(d => d.id === departmentId);
          if (!department) {
            reject(new Error('選択された学科が見つかりません'));
            return;
          }
          
          // 必要なファイルの内容を取得
          const requirementsFile = department.requirementsFile;
          const categoriesFile = department.courseCategoriesFile;
          
          const requirementsData = result.fileContents[requirementsFile];
          const categoriesData = result.fileContents[categoriesFile];
          
          if (!requirementsData || !categoriesData) {
            reject(new Error('要件ファイルまたはカテゴリファイルが見つかりません'));
            return;
          }
          
          const key = `${facultyId}_${departmentId}`;
          
          resolve({
            faculty,
            department,
            courseId,
            requirements: requirementsData.requirements[key],
            categories: categoriesData.courseCategories[key]
          });
        } catch (error) {
          reject(error);
        }
      }
    );
  });
}

// 設定情報の取得
function getSettings(facultyId, departmentId) {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.get(
        ['ritsumeiAll', 'fileContents'], 
        (result) => {
          if (!result.ritsumeiAll || !result.fileContents) {
            reject(new Error('設定データが見つかりません'));
            return;
          }
          
          // 指定された学部・学科を検索
          const faculty = result.ritsumeiAll.faculties.find(f => f.id === facultyId);
          if (!faculty) {
            reject(new Error('指定された学部が見つかりません'));
            return;
          }
          
          const department = faculty.departments.find(d => d.id === departmentId);
          if (!department) {
            reject(new Error('指定された学科が見つかりません'));
            return;
          }
          
          // 必要なファイルを特定
          const requirementsFile = department.requirementsFile;
          const categoriesFile = department.courseCategoriesFile;
          
          // ファイル内容を取得
          const requirementsData = result.fileContents[requirementsFile];
          const categoriesData = result.fileContents[categoriesFile];
          
          if (!requirementsData || !categoriesData) {
            reject(new Error('要件データまたはカテゴリデータが見つかりません'));
            return;
          }
          
          const key = `${facultyId}_${departmentId}`;
          
          resolve({
            faculty,
            department,
            requirements: requirementsData.requirements[key],
            categories: categoriesData.courseCategories[key]
          });
        }
      );
    } catch (error) {
      reject(error);
    }
  });
}

// 科目一覧ページから詳細な科目データを取得
function extractCourseData() {
  console.log("科目データの抽出を開始します...");
  
  // 科目行データの取得方法を複数試す
  let courseRows = document.querySelectorAll('table.result_title tr:not(:first-child)');
  
  if (!courseRows || courseRows.length === 0) {
    courseRows = document.querySelectorAll('table[width*="100%"] tr:not(:first-child)');
  }
  
  if (!courseRows || courseRows.length === 0) {
    courseRows = document.querySelectorAll('.result_list table tr:not(:first-child)');
  }
  
  if (!courseRows || courseRows.length === 0) {
    console.log("科目データが見つかりません");
    return null;
  }
  
  console.log(`${courseRows.length}行のデータを検出しました`);
  
  const courses = [];
  
  // 最初の行をチェックしてヘッダーかどうかを確認（ヘッダーならスキップする）
  let startIndex = 0;
  if (courseRows.length > 0) {
    const firstRow = courseRows[0];
    const firstCells = firstRow.querySelectorAll('th');
    if (firstCells.length > 0) {
      startIndex = 1; // 最初の行がヘッダーなのでスキップ
    }
  }
  
  for (let i = startIndex; i < courseRows.length; i++) {
    const row = courseRows[i];
    const cells = row.querySelectorAll('td');
    
    if (cells.length >= 5) { // 最低限必要なセルの数
      // データ構造を判断
      let course = {
        category: '',
        name: '',
        class: '',
        instructor: '',
        credits: 0,
        grade: '',
        semester: '',
        completed: false
      };
      
      // テーブル構造に基づいてデータの取得方法を調整
      if (cells.length >= 7) {
        // 標準的なテーブル構造
        course.category = cells[0].textContent.trim();
        course.name = cells[1].textContent.trim();
        course.class = cells[2].textContent.trim();
        course.instructor = cells[3].textContent.trim();
        course.credits = parseFloat(cells[4].textContent.trim()) || 0;
        course.grade = cells[5].textContent.trim();
        course.semester = cells[7] ? cells[7].textContent.trim() : (cells[6] ? cells[6].textContent.trim() : '');
      } else if (cells.length === 6) {
        // 6列の場合
        course.category = cells[0].textContent.trim();
        course.name = cells[1].textContent.trim();
        course.instructor = cells[2].textContent.trim();
        course.credits = parseFloat(cells[3].textContent.trim()) || 0;
        course.grade = cells[4].textContent.trim();
        course.semester = cells[5].textContent.trim();
      } else if (cells.length === 5) {
        // 5列の場合
        course.name = cells[0].textContent.trim();
        course.instructor = cells[1].textContent.trim();
        course.credits = parseFloat(cells[2].textContent.trim()) || 0;
        course.grade = cells[3].textContent.trim();
        course.semester = cells[4].textContent.trim();
      }
      
      // 科目名に科目番号がついていることがあるので処理
      course.name = course.name.replace(/^\d+\s+/, '').trim();
      
      // 遠隔授業科目の「*」マークを削除
      course.name = course.name.replace(/\s*\*\s*$/, '').trim();
      
      // 単位取得状況の判定
      course.completed = course.grade !== '' && 
                         !['不可', '／', '-', 'F', ''].includes(course.grade);
      
      // 有効なデータのみ追加
      if (course.name && course.name !== '') {
        courses.push(course);
      }
    }
  }
  
  if (courses.length === 0) {
    console.log("有効な科目データが取得できませんでした");
    return null;
  }
  
  console.log(`${courses.length}個の科目データを抽出しました`);
  return { courses };
}

// 科目の区分を判定する関数
function determineCourseCategory(courseName, categories, courseId) {
  // 指定されたカテゴリに科目が含まれているかチェック
  function isInCategory(categoryName) {
    return categories[categoryName] && 
           (Array.isArray(categories[categoryName]) 
             ? categories[categoryName].includes(courseName)
             : false);
  }
  
  // 外国語科目
  if (isInCategory('foreignLanguage')) {
    return 'foreignLanguage';
  }
  
  // 教養科目
  if (isInCategory('generalEducation')) {
    return 'generalEducation';
  }
  
  // 基礎専門科目
  if (isInCategory('specializedBasic')) {
    return 'specializedBasic';
  }
  
  // 共通専門科目
  if (isInCategory('specializedCommon')) {
    return 'specializedCommon';
  }
  
  // 専門科目（コースあり）
  if (categories.hasCourses && categories.specializedCore) {
    // 共通専門科目
    if (categories.specializedCore.common && 
        categories.specializedCore.common.includes(courseName)) {
      return 'specializedCore';
    }
    
    // コース別専門科目
    if (courseId && categories.specializedCore[courseId] && 
        categories.specializedCore[courseId].includes(courseName)) {
      return 'specializedCore';
    }
  }
  // 専門科目（コースなし）
  else if (!categories.hasCourses && isInCategory('specializedCore')) {
    return 'specializedCore';
  }
  
  // グローバルキャリア科目
  if (isInCategory('globalCareer') || isInCategory('careerGlobal')) {
    return 'globalCareer';
  }
  
  // 判定できない場合はデフォルトの「専門科目」を返す
  return 'specializedCore';
}

// 区分ごとの単位数を集計する関数
async function calculateCredits(courses, settings, courseId) {
  const categories = settings.categories;
  const requirements = settings.requirements;
  
  const result = {
    foreignLanguage: 0,
    generalEducation: 0,
    specializedBasic: 0,
    specializedCommon: 0,
    specializedCore: 0,
    globalCareer: 0,
    total: 0,
    completedCourses: [],
    inProgressCourses: [],
    requiredCourses: {
      completed: [],
      remaining: []
    }
  };
  
  // 必修科目リストの取得
  let requiredCourses = [];
  if (settings.department.hasCourses && courseId && 
      requirements.courses && requirements.courses[courseId]) {
    requiredCourses = requirements.courses[courseId].requiredCourses || [];
  } else if (!settings.department.hasCourses && requirements.requiredCourses) {
    requiredCourses = requirements.requiredCourses;
  }
  
  // 区分ごとに単位を集計
  courses.forEach(course => {
    if (course.completed) {
      result.completedCourses.push(course);
      
      // 科目区分の判定
      const categoryKey = determineCourseCategory(course.name, categories, courseId);
      
      // 単位を加算
      if (result[categoryKey] !== undefined) {
        result[categoryKey] += course.credits;
      } else {
        // 不明な区分の場合は専門科目に加算
        result.specializedCore += course.credits;
      }
      
      // 総単位数に加算
      result.total += course.credits;
      
      // 必修科目リストに含まれていれば記録
      if (requiredCourses.includes(course.name)) {
        result.requiredCourses.completed.push(course.name);
      }
    } else if (course.grade === '') {
      // 現在履修中の科目
      result.inProgressCourses.push(course);
    }
  });
  
  // 未履修の必修科目を抽出
  result.requiredCourses.remaining = requiredCourses.filter(
    courseName => !result.requiredCourses.completed.includes(courseName)
  );
  
  return result;
}

// 卒業要件との照合
async function checkGraduationRequirements(credits, requirements) {
  const reqs = requirements.common;
  
  // 不足単位の計算
  const missing = {
    foreignLanguage: reqs.foreignLanguage ? Math.max(0, reqs.foreignLanguage - credits.foreignLanguage) : 0,
    generalEducation: reqs.generalEducation ? Math.max(0, reqs.generalEducation - credits.generalEducation) : 0,
    specializedBasic: reqs.specializedBasic ? Math.max(0, reqs.specializedBasic - credits.specializedBasic) : 0,
    specializedCommon: reqs.specializedCommon ? Math.max(0, reqs.specializedCommon - credits.specializedCommon) : 0,
    specializedCore: reqs.specializedCore ? Math.max(0, reqs.specializedCore - credits.specializedCore) : 0,
    totalSpecialized: reqs.totalSpecialized ? Math.max(0, reqs.totalSpecialized - 
      (credits.specializedBasic + credits.specializedCommon + credits.specializedCore + credits.globalCareer)) : 0,
    total: reqs.total ? Math.max(0, reqs.total - credits.total) : 0
  };
  
  // 進捗率の計算
  const progress = {
    foreignLanguage: reqs.foreignLanguage ? Math.min(100, (credits.foreignLanguage / reqs.foreignLanguage) * 100) : 100,
    generalEducation: reqs.generalEducation ? Math.min(100, (credits.generalEducation / reqs.generalEducation) * 100) : 100,
    specializedBasic: reqs.specializedBasic ? Math.min(100, (credits.specializedBasic / reqs.specializedBasic) * 100) : 100,
    specializedCommon: reqs.specializedCommon ? Math.min(100, (credits.specializedCommon / reqs.specializedCommon) * 100) : 100,
    specializedCore: reqs.specializedCore ? Math.min(100, (credits.specializedCore / reqs.specializedCore) * 100) : 100,
    totalSpecialized: reqs.totalSpecialized ? Math.min(100, ((credits.specializedBasic + credits.specializedCommon + 
                        credits.specializedCore + credits.globalCareer) / reqs.totalSpecialized) * 100) : 100,
    total: reqs.total ? Math.min(100, (credits.total / reqs.total) * 100) : 100
  };
  
  return {
    fulfilled: missing.total === 0,
    missing,
    progress
  };
}

// 履修済みまたは現在履修中の科目名のリストを取得
function getCompletedOrInProgressCourseNames(courses) {
  return courses.map(course => course.name);
}

// 推奨科目を生成する関数
async function generateRecommendations(credits, graduationCheck, settings, allCourses) {
  const recommendations = {
    required: [], // 必修科目
    specializedCore: [], // 専門科目（不足している場合）
    generalEducation: [], // 教養科目（不足している場合）
    foreignLanguage: [], // 外国語科目（不足している場合）
    specializedBasic: [], // 基礎専門科目（不足している場合）
    specializedCommon: [], // 共通専門科目
    other: [] // その他推奨科目
  };
  
  // 取得済みおよび履修中の科目名をリスト化
  const completedCourseNames = getCompletedOrInProgressCourseNames(
    [...credits.completedCourses, ...credits.inProgressCourses]
  );
  
  // 必修科目の確認と推奨
  if (credits.requiredCourses && credits.requiredCourses.remaining.length > 0) {
    recommendations.required = credits.requiredCourses.remaining;
  }
  
  // コース情報とカテゴリーデータの取得
  const courseId = settings.department.hasCourses ? settings.courseId : null;
  const categories = settings.categories;
  
  // 不足している単位カテゴリーの特定
  const missing = graduationCheck.missing;
  
  // 各カテゴリごとに推奨科目を生成
  
  // 1. 専門科目（コース別）
  if (missing.specializedCore > 0 && categories.specializedCore) {
    // コース固有の専門科目から未取得の科目をリストアップ
    let courseCoreSubjects = [];
    
    if (courseId && categories.specializedCore[courseId]) {
      courseCoreSubjects = categories.specializedCore[courseId];
    } else if (categories.specializedCore.common) {
      courseCoreSubjects = categories.specializedCore.common;
    }
    
    // 未取得の科目を抽出
    const uncompletedCoreSubjects = courseCoreSubjects.filter(
      subject => !completedCourseNames.includes(subject)
    );
    
    // 優先度順にソート（必修科目を優先）
    recommendations.specializedCore = uncompletedCoreSubjects.sort((a, b) => {
      const aIsRequired = recommendations.required.includes(a);
      const bIsRequired = recommendations.required.includes(b);
      
      if (aIsRequired && !bIsRequired) return -1;
      if (!aIsRequired && bIsRequired) return 1;
      return 0;
    });
  }
  
  // 2. 教養科目
  if (missing.generalEducation > 0 && categories.generalEducation) {
    const uncompletedGeneralEdu = categories.generalEducation.filter(
      subject => !completedCourseNames.includes(subject)
    );
    recommendations.generalEducation = uncompletedGeneralEdu.slice(0, 10); // 上位10件
  }
  
  // 3. 外国語科目
  if (missing.foreignLanguage > 0 && categories.foreignLanguage) {
    const uncompletedForeignLang = categories.foreignLanguage.filter(
      subject => !completedCourseNames.includes(subject)
    );
    recommendations.foreignLanguage = uncompletedForeignLang.slice(0, 10); // 上位10件
  }
  
  // 4. 基礎専門科目
  if (missing.specializedBasic > 0 && categories.specializedBasic) {
    const uncompletedSpecializedBasic = categories.specializedBasic.filter(
      subject => !completedCourseNames.includes(subject)
    );
    recommendations.specializedBasic = uncompletedSpecializedBasic.slice(0, 10); // 上位10件
  }
  
  // 5. 共通専門科目
  if (missing.specializedCommon > 0 && categories.specializedCommon) {
    const uncompletedSpecializedCommon = categories.specializedCommon.filter(
      subject => !completedCourseNames.includes(subject)
    );
    recommendations.specializedCommon = uncompletedSpecializedCommon.slice(0, 10); // 上位10件
  }
  
  // 現在の表示科目からフィルタリングするコードを無効化（JSONファイルからの推奨に変更）
  /*
  if (allCourses && allCourses.length > 0) {
    const availableCourseNames = allCourses
      .filter(course => !course.completed && course.grade === '') // 未履修科目
      .map(course => course.name);
    
    // 各カテゴリの推奨科目を利用可能な科目に絞り込む
    Object.keys(recommendations).forEach(category => {
      if (Array.isArray(recommendations[category])) {
        recommendations[category] = recommendations[category].filter(
          courseName => availableCourseNames.includes(courseName)
        );
      }
    });
  }
  */
  
  return recommendations;
}

// ======= UI関連機能 =======

// 分析ボタンの作成
function createAnalysisButton() {
  // 既存のボタンがあれば削除
  const existingButton = document.getElementById('credit-checker-button');
  if (existingButton) {
    existingButton.remove();
  }
  
  // ボタン作成
  const button = document.createElement('button');
  button.id = 'credit-checker-button';
  button.className = 'credit-checker-auto';
  button.textContent = '単位チェック';
  button.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background-color: #006699;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 10px 15px;
    font-weight: bold;
    cursor: pointer;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    z-index: 9999;
  `;
  
  // クリックイベント
  button.addEventListener('click', async () => {
    try {
      const settings = await getCurrentSettings();
      if (!settings) {
        alert('設定情報を取得できませんでした。');
        return;
      }
      
      // 科目データの取得と分析
      const courseData = extractCourseData();
      if (!courseData || !courseData.courses) {
        alert('科目データを取得できませんでした。');
        return;
      }
      
      // 単位計算
      const creditsData = await calculateCredits(
        courseData.courses, 
        settings,
        settings.department.hasCourses ? settings.courseId : null
      );
      
      // 卒業要件チェック
      const graduationCheck = await checkGraduationRequirements(
        creditsData,
        settings.requirements
      );
      
      // 推奨科目の生成
      const recommendations = await generateRecommendations(
        creditsData,
        graduationCheck,
        settings,
        courseData.courses
      );
      
      // 結果表示
      createResultUI(creditsData, graduationCheck, settings, recommendations);
      
      // データ保存
      chrome.storage.local.set({
        creditData: {
          credits: creditsData,
          graduationCheck,
          requirements: settings.requirements.common,
          recommendations
        },
        lastCheckedDate: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('単位チェック処理中にエラーが発生:', error);
      alert('単位チェック処理中にエラーが発生しました: ' + error.message);
    }
  });
  
  // ページに追加
  document.body.appendChild(button);
}

// 単位解析結果UIの作成
// 単位解析結果UIの作成
function createResultUI(credits, graduationCheck, settings, recommendations) {
  // 既存のUI要素を削除
  const existingUI = document.getElementById('credit-checker-result');
  if (existingUI) {
    existingUI.remove();
  }
  
  // 要件情報の取得
  const requirements = settings.requirements.common;
  
  // メインコンテナ
  const container = document.createElement('div');
  container.id = 'credit-checker-result';
  container.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 80%;
    max-width: 800px;
    max-height: 90vh;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    z-index: 10000;
    padding: 20px;
    overflow-y: auto;
  `;
  
  // ヘッダー
  const header = document.createElement('div');
  header.style.cssText = `
    border-bottom: 2px solid #006699;
    margin-bottom: 20px;
    padding-bottom: 10px;
    text-align: center;
  `;
  header.innerHTML = `<h2 style="margin: 0; color: #006699; font-size: 22px;">立命館大学 単位チェッカー</h2>`;
  container.appendChild(header);
  
  // 選択情報
  const infoSection = document.createElement('div');
  infoSection.style.cssText = `margin-bottom: 20px; font-size: 14px;`;
  infoSection.innerHTML = `
    <p><strong>学部:</strong> ${settings.faculty.name}</p>
    <p><strong>学科:</strong> ${settings.department.name}</p>
    ${settings.department.hasCourses && settings.courseId ? 
      `<p><strong>コース:</strong> ${settings.department.courses.find(c => c.id === settings.courseId)?.name || settings.courseId}</p>` : ''}
  `;
  container.appendChild(infoSection);
  
  // 単位取得状況セクション
  const creditSection = document.createElement('div');
  creditSection.style.cssText = `margin-bottom: 25px;`;
  
  // タイトル
  const creditTitle = document.createElement('h3');
  creditTitle.style.cssText = `
    margin-top: 0;
    color: #333;
    border-left: 4px solid #006699;
    padding-left: 10px;
    font-size: 18px;
  `;
  creditTitle.textContent = '単位取得状況';
  creditSection.appendChild(creditTitle);
  
  // 単位情報のテーブル
  const creditTable = document.createElement('table');
  creditTable.style.cssText = `
    width: 100%;
    border-collapse: collapse;
    margin: 15px 0;
  `;
  
  let tableHTML = '';
  
  // 単位区分ごとの行を生成
  function addCreditRow(label, current, required, progressPercent) {
    if (required === undefined || required === null) return '';
    
    const percent = progressPercent !== undefined ? progressPercent : 
                   (required > 0 ? Math.min(100, (current / required) * 100) : 100);
    
    return `
      <tr>
        <td style="padding: 8px; text-align: left; border-bottom: 1px solid #eee;">${label}</td>
        <td style="padding: 8px; text-align: right; border-bottom: 1px solid #eee; font-weight: bold;">${current} / ${required}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; width: 50%;">
          <div style="background-color: #f0f0f0; height: 12px; border-radius: 6px; overflow: hidden;">
            <div style="background-color: #4CAF50; height: 100%; width: ${percent}%;"></div>
          </div>
        </td>
      </tr>
    `;
  }
  
  // 各区分の行を追加
  if (requirements.foreignLanguage) {
    tableHTML += addCreditRow('外国語科目', credits.foreignLanguage, requirements.foreignLanguage, graduationCheck.progress.foreignLanguage);
  }
  
  if (requirements.generalEducation) {
    tableHTML += addCreditRow('教養科目', credits.generalEducation, requirements.generalEducation, graduationCheck.progress.generalEducation);
  }
  
  if (requirements.specializedBasic) {
    tableHTML += addCreditRow('基礎専門科目', credits.specializedBasic, requirements.specializedBasic, graduationCheck.progress.specializedBasic);
  }
  
  if (requirements.specializedCommon) {
    tableHTML += addCreditRow('共通専門科目', credits.specializedCommon, requirements.specializedCommon, graduationCheck.progress.specializedCommon);
  }
  
  if (requirements.specializedCore) {
    tableHTML += addCreditRow('固有専門科目', credits.specializedCore, requirements.specializedCore, graduationCheck.progress.specializedCore);
  }
  
  // 専門科目合計
  if (requirements.totalSpecialized) {
    const specializedTotal = (credits.specializedBasic || 0) + 
                            (credits.specializedCommon || 0) + 
                            (credits.specializedCore || 0) + 
                            (credits.globalCareer || 0);
    
    tableHTML += `
      <tr style="background-color: #f9f9f9;">
        <td style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd; font-weight: bold;">専門科目合計</td>
        <td style="padding: 8px; text-align: right; border-bottom: 1px solid #ddd; font-weight: bold;">${specializedTotal} / ${requirements.totalSpecialized}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; width: 50%;">
          <div style="background-color: #f0f0f0; height: 12px; border-radius: 6px; overflow: hidden;">
            <div style="background-color: #006699; height: 100%; width: ${graduationCheck.progress.totalSpecialized}%;"></div>
          </div>
        </td>
      </tr>
    `;
  }
  
  // 総単位数
  tableHTML += `
    <tr style="background-color: #f1f8e9;">
      <td style="padding: 10px; text-align: left; font-weight: bold; font-size: 16px;">総合計</td>
      <td style="padding: 10px; text-align: right; font-weight: bold; font-size: 16px;">${credits.total} / ${requirements.total}</td>
      <td style="padding: 10px; width: 50%;">
        <div style="background-color: #f0f0f0; height: 14px; border-radius: 7px; overflow: hidden;">
          <div style="background-color: #2E7D32; height: 100%; width: ${graduationCheck.progress.total}%;"></div>
        </div>
      </td>
    </tr>
  `;
  
  creditTable.innerHTML = tableHTML;
  creditSection.appendChild(creditTable);
  
  container.appendChild(creditSection);
  
  // 必修科目セクション
  if (credits.requiredCourses && (credits.requiredCourses.completed.length > 0 || credits.requiredCourses.remaining.length > 0)) {
    const requiredSection = document.createElement('div');
    requiredSection.style.cssText = `margin-bottom: 25px;`;
    
    // タイトル
    const requiredTitle = document.createElement('h3');
    requiredTitle.style.cssText = `
      margin-top: 0;
      color: #333;
      border-left: 4px solid #006699;
      padding-left: 10px;
      font-size: 18px;
    `;
    requiredTitle.textContent = '必修科目取得状況';
    requiredSection.appendChild(requiredTitle);
    
    // 進捗バー
    const totalRequired = credits.requiredCourses.completed.length + credits.requiredCourses.remaining.length;
    const completedPercent = totalRequired > 0 ? 
                            (credits.requiredCourses.completed.length / totalRequired) * 100 : 0;
    
    const progressBar = document.createElement('div');
    progressBar.style.cssText = `
      background-color: #f0f0f0;
      height: 16px;
      border-radius: 8px;
      overflow: hidden;
      margin: 15px 0;
    `;
    progressBar.innerHTML = `<div style="background-color: #4CAF50; height: 100%; width: ${completedPercent}%;"></div>`;
    requiredSection.appendChild(progressBar);
    
    // 進捗テキスト
    const progressText = document.createElement('div');
    progressText.style.cssText = `
      text-align: center;
      margin-bottom: 15px;
      font-weight: bold;
    `;
    progressText.textContent = `${credits.requiredCourses.completed.length} / ${totalRequired} 科目取得済み`;
    requiredSection.appendChild(progressText);
    
    // 残りの必修科目
    if (credits.requiredCourses.remaining.length > 0) {
      const remainingTitle = document.createElement('h4');
      remainingTitle.style.cssText = `
        margin-top: 15px;
        color: #555;
        font-size: 16px;
      `;
      remainingTitle.textContent = '残りの必修科目';
      requiredSection.appendChild(remainingTitle);
      
      const remainingList = document.createElement('ul');
      remainingList.style.cssText = `
        padding-left: 25px;
        margin-top: 5px;
      `;
      
      credits.requiredCourses.remaining.forEach(course => {
        const item = document.createElement('li');
        item.style.cssText = `margin-bottom: 3px;`;
        item.textContent = course;
        remainingList.appendChild(item);
      });
      
      requiredSection.appendChild(remainingList);
    }
    
    container.appendChild(requiredSection);
  }
  
  // 推奨科目セクション
  const recommendationsSection = document.createElement('div');
  recommendationsSection.style.cssText = `margin-bottom: 25px;`;
  
  // タイトル
  const recommendationsTitle = document.createElement('h3');
  recommendationsTitle.style.cssText = `
    margin-top: 0;
    color: #333;
    border-left: 4px solid #006699;
    padding-left: 10px;
    font-size: 18px;
  `;
  recommendationsTitle.textContent = '推奨科目';
  recommendationsSection.appendChild(recommendationsTitle);
  
  let hasAnyRecommendations = false;
  
  // 不足単位の詳細
  if (!graduationCheck.fulfilled) {
    const missingDetails = document.createElement('div');
    missingDetails.style.cssText = `
      margin-top: 15px;
      padding: 10px;
      background-color: #f5f5f5;
      border-radius: 5px;
    `;
    
    let missingHTML = '<h4 style="margin-top: 0; font-size: 15px;">不足単位:</h4><ul style="margin-top: 5px;">';
    
    // 不足している区分のみ表示
    if (graduationCheck.missing.foreignLanguage > 0) {
      missingHTML += `<li>外国語科目: ${graduationCheck.missing.foreignLanguage}単位</li>`;
    }
    
    if (graduationCheck.missing.generalEducation > 0) {
      missingHTML += `<li>教養科目: ${graduationCheck.missing.generalEducation}単位</li>`;
    }
    
    if (graduationCheck.missing.specializedBasic > 0) {
      missingHTML += `<li>基礎専門科目: ${graduationCheck.missing.specializedBasic}単位</li>`;
    }
    
    if (graduationCheck.missing.specializedCommon > 0) {
      missingHTML += `<li>共通専門科目: ${graduationCheck.missing.specializedCommon}単位</li>`;
    }
    
    if (graduationCheck.missing.specializedCore > 0) {
      missingHTML += `<li>固有専門科目: ${graduationCheck.missing.specializedCore}単位</li>`;
    }
    
    if (graduationCheck.missing.totalSpecialized > 0) {
      missingHTML += `<li>専門科目合計: ${graduationCheck.missing.totalSpecialized}単位</li>`;
    }
    
    if (graduationCheck.missing.total > 0) {
      missingHTML += `<li>総単位数: ${graduationCheck.missing.total}単位</li>`;
    }
    
    missingHTML += '</ul>';
    missingDetails.innerHTML = missingHTML;
    recommendationsSection.appendChild(missingDetails);
  }
  
  // 必修科目の推奨
  if (recommendations && recommendations.required && recommendations.required.length > 0) {
    hasAnyRecommendations = true;
    const requiredRecommendations = document.createElement('div');
    requiredRecommendations.style.cssText = `
      margin-top: 15px;
      margin-bottom: 15px;
      padding: 10px;
      background-color: #fff8e1;
      border: 1px solid #ffe082;
      border-radius: 5px;
    `;
    
    const requiredTitle = document.createElement('h4');
    requiredTitle.style.cssText = `margin-top: 0; font-size: 16px; color: #ff8f00;`;
    requiredTitle.textContent = '必修科目（優先的に履修すべき科目）';
    requiredRecommendations.appendChild(requiredTitle);
    
    const requiredList = document.createElement('ul');
    requiredList.style.cssText = `margin-top: 5px; padding-left: 25px;`;
    
    recommendations.required.forEach(course => {
      const item = document.createElement('li');
      item.textContent = course;
      requiredList.appendChild(item);
    });
    
    requiredRecommendations.appendChild(requiredList);
    recommendationsSection.appendChild(requiredRecommendations);
  }
  
  // カテゴリ別推奨科目
  const categories = [
    { id: 'specializedCore', name: '専門科目', color: '#e8f5e9', borderColor: '#c8e6c9', titleColor: '#2e7d32' },
    { id: 'specializedCommon', name: '共通専門科目', color: '#e3f2fd', borderColor: '#bbdefb', titleColor: '#1565c0' },
    { id: 'specializedBasic', name: '基礎専門科目', color: '#e8eaf6', borderColor: '#c5cae9', titleColor: '#3949ab' },
    { id: 'generalEducation', name: '教養科目', color: '#f9fbe7', borderColor: '#f0f4c3', titleColor: '#827717' },
    { id: 'foreignLanguage', name: '外国語科目', color: '#fff3e0', borderColor: '#ffe0b2', titleColor: '#e65100' }
  ];
  
  categories.forEach(category => {
    if (recommendations && recommendations[category.id] && recommendations[category.id].length > 0) {
      hasAnyRecommendations = true;
      
      const categorySection = document.createElement('div');
      categorySection.style.cssText = `
        margin-top: 15px;
        margin-bottom: 15px;
        padding: 10px;
        background-color: ${category.color};
        border: 1px solid ${category.borderColor};
        border-radius: 5px;
      `;
      
      const categoryTitle = document.createElement('h4');
      categoryTitle.style.cssText = `margin-top: 0; font-size: 16px; color: ${category.titleColor};`;
      categoryTitle.textContent = `${category.name}（${recommendations[category.id].length}科目）`;
      categorySection.appendChild(categoryTitle);
      
      const categoryList = document.createElement('ul');
      categoryList.style.cssText = `margin-top: 5px; padding-left: 25px;`;
      
      recommendations[category.id].forEach(course => {
        const item = document.createElement('li');
        item.textContent = course;
        categoryList.appendChild(item);
      });
      
      // JSONファイルからの情報である旨の注記を追加
      const noteText = document.createElement('p');
      noteText.style.cssText = `margin-top: 8px; font-size: 12px; color: #666; font-style: italic;`;
      noteText.textContent = '※ こちらはJSONファイルに登録されている全科目から選択しています。現在の学期に開講していない科目も含まれる場合があります。';
      
      categorySection.appendChild(categoryList);
      categorySection.appendChild(noteText);
      recommendationsSection.appendChild(categorySection);
    }
  });
  
  // 推奨科目がない場合
  if (!hasAnyRecommendations) {
    const noRecommendations = document.createElement('p');
    noRecommendations.style.cssText = `
      padding: 15px;
      background-color: #e8f5e9;
      border: 1px solid #c8e6c9;
      border-radius: 5px;
      text-align: center;
      margin-top: 15px;
    `;
    noRecommendations.textContent = '卒業要件を満たしているため、特に推奨科目はありません。';
    recommendationsSection.appendChild(noRecommendations);
  }
  
  container.appendChild(recommendationsSection);
  
  // 卒業要件セクション
  const gradSection = document.createElement('div');
  gradSection.style.cssText = `margin-bottom: 25px;`;
  
  // タイトル
  const gradTitle = document.createElement('h3');
  gradTitle.style.cssText = `
    margin-top: 0;
    color: #333;
    border-left: 4px solid #006699;
    padding-left: 10px;
    font-size: 18px;
  `;
  gradTitle.textContent = '卒業要件充足状況';
  gradSection.appendChild(gradTitle);
  
  // 要件ステータス
  const gradStatus = document.createElement('div');
  gradStatus.style.cssText = `
    padding: 15px;
    border-radius: 5px;
    margin-top: 10px;
    text-align: center;
    font-weight: bold;
    font-size: 16px;
    ${graduationCheck.fulfilled ? 
      'background-color: #e8f5e9; color: #2e7d32; border: 1px solid #c8e6c9;' : 
      'background-color: #ffebee; color: #c62828; border: 1px solid #ffcdd2;'}
  `;
  gradStatus.textContent = graduationCheck.fulfilled ? 
                          '卒業要件を満たしています' : 
                          '卒業要件を満たしていません';
  gradSection.appendChild(gradStatus);
  
  container.appendChild(gradSection);
  
  // 詳細ボタン
  const detailButton = document.createElement('button');
  detailButton.style.cssText = `
    display: block;
    width: 100%;
    background-color: #2196F3;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 10px;
    cursor: pointer;
    font-weight: bold;
    margin-top: 20px;
    margin-bottom: 10px;
  `;
  detailButton.textContent = '詳細な科目一覧を見る';
  detailButton.addEventListener('click', () => {
    container.remove();
    showDetailedRecommendations();
  });
  container.appendChild(detailButton);
  
  // 免責事項
  const disclaimer = document.createElement('div');
  disclaimer.style.cssText = `
    margin-top: 10px;
    padding: 10px;
    background-color: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 4px;
    font-size: 12px;
    color: #666;
  `;
  disclaimer.innerHTML = `
    <p>※このツールは参考用です。正確な履修・卒業要件については必ず大学の公式情報を確認してください。</p>
    <p>最終更新: ${new Date().toLocaleString()}</p>
  `;
  container.appendChild(disclaimer);
  
  // 閉じるボタン
  const closeButton = document.createElement('button');
  closeButton.style.cssText = `
    display: block;
    width: 100%;
    background-color: #006699;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 10px;
    cursor: pointer;
    font-weight: bold;
    margin-top: 10px;
  `;
  closeButton.textContent = '閉じる';
  closeButton.addEventListener('click', () => container.remove());
  container.appendChild(closeButton);
  
  // ページに追加
  document.body.appendChild(container);
}