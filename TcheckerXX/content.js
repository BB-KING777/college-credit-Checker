// content.js - キャンパスウェブのページで実行されるスクリプト

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
  });
  
  // ページ読み込み完了時の処理
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onPageLoaded);
  } else {
    onPageLoaded();
  }
}

// 現在のページタイプを判定する関数
function getCurrentPageType() {
  // ページのタイトル要素をチェック
  const titleElements = document.querySelectorAll('h1, div.title, div.subwin_title, .title_subwin_title');
  for (const el of titleElements) {
    const titleText = el.textContent || '';
    if (titleText.includes('科目一覧')) {
      return 'course-list';
    }
  }
  
  // コース表テーブルがあるかチェック
  const tables = document.querySelectorAll('table.result_title, table[width*="100%"]');
  if (tables.length > 0) {
    const firstTable = tables[0];
    const headers = firstTable.querySelectorAll('th');
    const headerTexts = Array.from(headers).map(h => h.textContent || '');
    
    if (headerTexts.includes('科目名称') || headerTexts.includes('区分') || headerTexts.includes('単位数')) {
      return 'course-list';
    }
  }
  
  return 'unknown';
}

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
    
    // レスポンス送信
    sendResponse({ 
      success: true, 
      data: {
        credits: creditsData,
        graduationCheck,
        requirements: settings.requirements.common
      }
    });
  } catch (error) {
    console.error('単位チェック処理でエラーが発生:', error);
    sendResponse({ success: false, message: error.toString() });
  }
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
        course.semester = cells[6].textContent.trim();
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
  if (isInCategory('globalCareer')) {
    return 'globalCareer';
  }
  
  // 判定できない場合はカテゴリ名をそのまま使用
  return courseName.category || 'specializedCore';
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
      
      // 結果表示
      createResultUI(creditsData, graduationCheck, settings);
      
      // データ保存
      chrome.storage.local.set({
        creditData: {
          credits: creditsData,
          graduationCheck,
          requirements: settings.requirements.common
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

// 単位解析結果UIの作成
function createResultUI(credits, graduationCheck, settings) {
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
    gradSection.appendChild(missingDetails);
  }
  
  container.appendChild(gradSection);
  
  // 免責事項
  const disclaimer = document.createElement('div');
  disclaimer.style.cssText = `
    margin-top: 20px;
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
    margin-top: 20px;
  `;
  closeButton.textContent = '閉じる';
  closeButton.addEventListener('click', () => container.remove());
  container.appendChild(closeButton);
  
  // ページに追加
  document.body.appendChild(container);
}

// 初期化実行
initialize();