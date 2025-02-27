// popup.js - ポップアップの動作を制御するスクリプト

// ポップアップの初期化
document.addEventListener('DOMContentLoaded', () => {
  // 選択セレクタの初期化
  initializeSelectors();
  
  // ボタンのイベントリスナー設定
  document.getElementById('check-button').addEventListener('click', runCreditCheck);
  document.getElementById('settings-button').addEventListener('click', openSettings);
  
  // 保存されている単位データがあれば表示
  loadSavedCreditData();
  
  // 現在のタブのページタイプをチェック
  checkCurrentPage();
});

// 学部・学科・コースセレクタの初期化
function initializeSelectors() {
  chrome.storage.local.get(
    ['ritsumeiAll', 'selectedFaculty', 'selectedDepartment', 'selectedCourse'], 
    (result) => {
      const { ritsumeiAll, selectedFaculty, selectedDepartment, selectedCourse } = result;
      
      if (!ritsumeiAll) {
        console.log('大学データが読み込まれていません');
        return;
      }
      
      const facultySelect = document.getElementById('popup-faculty-select');
      const departmentSelect = document.getElementById('popup-department-select');
      const courseSelect = document.getElementById('popup-course-select');
      const courseContainer = document.getElementById('course-selection-container');
      
      // 学部選択肢を生成
      facultySelect.innerHTML = '';
      ritsumeiAll.faculties.forEach(faculty => {
        const option = document.createElement('option');
        option.value = faculty.id;
        option.textContent = faculty.name;
        facultySelect.appendChild(option);
      });
      facultySelect.value = selectedFaculty || ritsumeiAll.faculties[0].id;
      
      // 学科選択肢を更新する関数
      const updateDepartments = () => {
        const faculty = ritsumeiAll.faculties.find(f => f.id === facultySelect.value) || ritsumeiAll.faculties[0];
        departmentSelect.innerHTML = '';
        
        faculty.departments.forEach(dept => {
          const option = document.createElement('option');
          option.value = dept.id;
          option.textContent = dept.name;
          departmentSelect.appendChild(option);
        });
        
        departmentSelect.value = selectedDepartment || (faculty.departments.length > 0 ? faculty.departments[0].id : '');
        
        updateCourses();
      };
      
      // コース選択肢を更新する関数
      const updateCourses = () => {
        const faculty = ritsumeiAll.faculties.find(f => f.id === facultySelect.value) || ritsumeiAll.faculties[0];
        const department = faculty.departments.find(d => d.id === departmentSelect.value) || 
                          (faculty.departments.length > 0 ? faculty.departments[0] : null);
        
        if (!department) return;
        
        // コースがない場合は選択部分を非表示
        if (!department.hasCourses || department.courses.length === 0) {
          courseContainer.style.display = 'none';
          chrome.storage.local.set({ selectedCourse: null });
          return;
        }
        
        // コースがある場合は表示
        courseContainer.style.display = 'block';
        courseSelect.innerHTML = '';
        
        department.courses.forEach(course => {
          const option = document.createElement('option');
          option.value = course.id;
          option.textContent = course.name;
          courseSelect.appendChild(option);
        });
        
        // 選択値を設定
        const validCourse = department.courses.find(c => c.id === selectedCourse);
        courseSelect.value = validCourse ? selectedCourse : department.courses[0].id;
        chrome.storage.local.set({ selectedCourse: courseSelect.value });
      };
      
      // 初期表示
      updateDepartments();
      
      // イベントリスナー設定
      facultySelect.addEventListener('change', () => {
        chrome.storage.local.set({ selectedFaculty: facultySelect.value });
        updateDepartments();
      });
      
      departmentSelect.addEventListener('change', () => {
        chrome.storage.local.set({ selectedDepartment: departmentSelect.value });
        updateCourses();
      });
      
      courseSelect.addEventListener('change', () => {
        chrome.storage.local.set({ selectedCourse: courseSelect.value });
      });
    }
  );
}

// 現在のページタイプをチェック
function checkCurrentPage() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    
    // CAMPUS WEBのページかどうか確認
    if (activeTab && activeTab.url && activeTab.url.includes('cw.ritsumei.ac.jp')) {
      // コンテンツスクリプトにメッセージ送信
      chrome.tabs.sendMessage(
        activeTab.id, 
        { action: 'getPageType' },
        (response) => {
          if (chrome.runtime.lastError) {
            console.log("コンテンツスクリプトとの通信エラー:", chrome.runtime.lastError);
            showPageTypeMessage('unknown');
          } else if (response && response.pageType) {
            showPageTypeMessage(response.pageType);
          } else {
            showPageTypeMessage('unknown');
          }
        }
      );
    } else {
      showPageTypeMessage('not-campusweb');
    }
  });
}

// ページタイプに応じたメッセージを表示
function showPageTypeMessage(pageType) {
  const checkButton = document.getElementById('check-button');
  const instructionsElem = document.querySelector('.instructions');
  
  if (pageType === 'course-list') {
    instructionsElem.innerHTML = `
      <p class="notice success">現在科目一覧ページを表示中です。単位チェックを実行できます。</p>
    `;
    checkButton.disabled = false;
  } else if (pageType === 'not-campusweb') {
    instructionsElem.innerHTML = `
      <p class="notice warning">CAMPUS WEBのページを開いてください。</p>
      <ol>
        <li>CAMPUS WEBにログイン</li>
        <li>「履修状況確認（受講登録内容・成績一覧）」ページを開く</li>
        <li>「科目一覧」タブを開く</li>
        <li>単位チェックボタンをクリック</li>
      </ol>
    `;
    checkButton.disabled = true;
  } else {
    instructionsElem.innerHTML = `
      <p class="notice warning">科目一覧ページを開いてください。</p>
      <ol>
        <li>「履修状況確認（受講登録内容・成績一覧）」ページを開く</li>
        <li>「科目一覧」タブを開く</li>
        <li>単位チェックボタンをクリック</li>
      </ol>
    `;
    checkButton.disabled = false;
  }
}

// 単位チェック実行
function runCreditCheck() {
  const summaryContent = document.getElementById('summary-content');
  summaryContent.innerHTML = `<p class="loading"><span class="loading-spinner"></span>単位データを分析中...</p>`;
  
  // 設定値を取得
  chrome.storage.local.get(['selectedFaculty', 'selectedDepartment', 'selectedCourse'], (settings) => {
    // 現在アクティブなタブにメッセージ送信
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      
      // CAMPUS WEBのページかどうか確認
      if (!activeTab.url.includes('cw.ritsumei.ac.jp')) {
        showErrorMessage('CAMPUS WEBのページで実行してください。');
        return;
      }
      
      // コンテンツスクリプトにメッセージ送信
      chrome.tabs.sendMessage(
        activeTab.id, 
        { 
          action: 'checkCredits',
          faculty: settings.selectedFaculty,
          department: settings.selectedDepartment,
          course: settings.selectedCourse
        },
        (response) => {
          if (chrome.runtime.lastError) {
            showErrorMessage('科目一覧ページで実行してください。必要に応じて拡張機能を再読み込みしてください。');
          } else if (response && response.success) {
            displayCreditSummary(response.data);
            // データ保存
            chrome.storage.local.set({ 
              creditData: response.data,
              lastCheckedDate: new Date().toISOString()
            });
          } else {
            showErrorMessage(response?.message || '単位データの取得に失敗しました。');
          }
        }
      );
    });
  });
}

// 保存されている単位データの読み込み
function loadSavedCreditData() {
  chrome.storage.local.get(['creditData', 'lastCheckedDate'], (result) => {
    if (result.creditData) {
      displayCreditSummary(result.creditData);
    }
  });
}

// 単位データの要約表示
function displayCreditSummary(data) {
  const summaryContent = document.getElementById('summary-content');
  
  // 単位データがない場合
  if (!data || !data.credits) {
    summaryContent.innerHTML = `
      <p class="notice">単位データが見つかりません。</p>
      <p>CAMPUS WEBで「科目一覧」を開いて単位チェックを実行してください。</p>
    `;
    return;
  }
  
  // 単位データの表示
  const credits = data.credits;
  const graduationCheck = data.graduationCheck;
  const requirements = data.requirements;
  
  let progressClass = 'progress-warning';
  if (graduationCheck.progress.total >= 90) {
    progressClass = 'progress-good';
  } else if (graduationCheck.progress.total < 50) {
    progressClass = 'progress-bad';
  }
  
  // HTML生成
  let html = `
    <div class="summary-box">
      <div class="summary-row">
        <span class="summary-label">総取得単位数:</span>
        <span class="summary-value ${progressClass}">${credits.total} / ${requirements.total}</span>
        <div class="summary-progress">
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${graduationCheck.progress.total}%"></div>
          </div>
          <span class="progress-text">${Math.round(graduationCheck.progress.total)}%</span>
        </div>
      </div>
      
      <div class="summary-details">
  `;
  
  // 外国語科目
  if (requirements.foreignLanguage) {
    html += `
      <div class="summary-row">
        <span class="summary-label">外国語科目:</span>
        <span class="summary-value">${credits.foreignLanguage} / ${requirements.foreignLanguage}</span>
      </div>
    `;
  }
  
  // 教養科目
  if (requirements.generalEducation) {
    html += `
      <div class="summary-row">
        <span class="summary-label">教養科目:</span>
        <span class="summary-value">${credits.generalEducation} / ${requirements.generalEducation}</span>
      </div>
    `;
  }
  
  // 専門科目
// 専門科目
  const specializedTotal = (credits.specializedBasic || 0) + 
                          (credits.specializedCommon || 0) + 
                          (credits.specializedCore || 0) + 
                          (credits.globalCareer || 0);
  
  html += `
      <div class="summary-row">
        <span class="summary-label">専門科目:</span>
        <span class="summary-value">${specializedTotal} / ${requirements.totalSpecialized || 0}</span>
      </div>
    </div>
  </div>
  `;
  
  // 必修科目情報
  if (credits.requiredCourses && credits.requiredCourses.remaining) {
    const completedCount = credits.requiredCourses.completed.length;
    const totalCount = completedCount + credits.requiredCourses.remaining.length;
    
    html += `
    <div class="requirements-status">
      <h3>必修科目取得状況</h3>
      <div class="requirement-item ${completedCount === totalCount ? 'fulfilled' : 'not-fulfilled'}">
        <span class="requirement-label">必修科目:</span>
        <span class="requirement-value">${completedCount} / ${totalCount}</span>
      </div>
    `;
    
    if (credits.requiredCourses.remaining.length > 0) {
      html += `
        <div style="margin-top: 10px; font-size: 13px;">
          <strong>残りの必修科目:</strong>
          <ul style="padding-left: 20px; margin-top: 5px;">
            ${credits.requiredCourses.remaining.map(course => `<li>${course}</li>`).join('')}
          </ul>
        </div>
      `;
    }
    
    html += `</div>`;
  }
  
  // 卒業要件充足状況
  html += `
    <div class="requirements-status">
      <h3>卒業要件充足状況</h3>
      <div class="requirement-item ${graduationCheck.fulfilled ? 'fulfilled' : 'not-fulfilled'}">
        <span class="requirement-label">卒業要件:</span>
        <span class="requirement-value">${graduationCheck.fulfilled ? '充足' : '不足'}</span>
      </div>
    </div>
  `;
  
  // 最終更新日時
  html += `
    <div class="last-updated">
      <p>最終更新: ${new Date().toLocaleString()}</p>
    </div>
  `;
  
  summaryContent.innerHTML = html;
}

// エラーメッセージ表示
function showErrorMessage(message) {
  const summaryContent = document.getElementById('summary-content');
  summaryContent.innerHTML = `
    <div class="error-message">
      <p>${message}</p>
    </div>
  `;
}

// 設定画面を開く
function openSettings() {
  // 設定ダイアログの表示
  const settingsDialog = document.createElement('div');
  settingsDialog.className = 'settings-dialog';
  settingsDialog.innerHTML = `
    <div>
      <div class="settings-header">
        <h3>設定</h3>
        <button class="close-settings">✕</button>
      </div>
      <div class="settings-content">
        <div class="settings-item">
          <label>
            <input type="checkbox" id="auto-analysis" /> 
            科目一覧ページを開いたときに自動分析を実行
          </label>
        </div>
        <div class="settings-item">
          <label>入学年度:</label>
          <select id="admission-year">
            <option value="2022">2022年度</option>
            <option value="2023">2023年度</option>
            <option value="2024">2024年度</option>
          </select>
        </div>
        <div class="settings-actions">
          <button id="save-settings">保存</button>
          <button id="reset-settings">初期設定に戻す</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(settingsDialog);
  
  // 現在の設定を読み込んで表示
  chrome.storage.local.get(['autoAnalysis', 'admissionYear'], (result) => {
    const autoCheckbox = document.getElementById('auto-analysis');
    const yearSelect = document.getElementById('admission-year');
    
    autoCheckbox.checked = result.autoAnalysis !== false;
    if (result.admissionYear) {
      yearSelect.value = result.admissionYear;
    }
  });
  
  // 閉じるボタンのイベントリスナー
  document.querySelector('.close-settings').addEventListener('click', () => {
    settingsDialog.remove();
  });
  
  // 保存ボタンのイベントリスナー
  document.getElementById('save-settings').addEventListener('click', () => {
    const autoAnalysis = document.getElementById('auto-analysis').checked;
    const admissionYear = document.getElementById('admission-year').value;
    
    chrome.storage.local.set({ 
      autoAnalysis, 
      admissionYear 
    }, () => {
      showErrorMessage('設定を保存しました');
      settingsDialog.remove();
    });
  });
  
  // リセットボタンのイベントリスナー
  document.getElementById('reset-settings').addEventListener('click', () => {
    chrome.storage.local.set({ 
      autoAnalysis: true, 
      admissionYear: '2022' 
    }, () => {
      document.getElementById('auto-analysis').checked = true;
      document.getElementById('admission-year').value = '2022';
      showErrorMessage('設定をリセットしました');
    });
  });
}