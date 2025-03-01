// モバイルメニューの処理
document.addEventListener('DOMContentLoaded', function() {
  // モバイルメニュートグル
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  
  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', function() {
      mobileMenu.classList.toggle('active');
      mobileMenuBtn.textContent = mobileMenu.classList.contains('active') ? '✕' : '≡';
    });
    
    // メニューリンククリック時にメニューを閉じる
    const mobileMenuLinks = mobileMenu.querySelectorAll('a');
    mobileMenuLinks.forEach(link => {
      link.addEventListener('click', function() {
        mobileMenu.classList.remove('active');
        mobileMenuBtn.textContent = '≡';
      });
    });
  }
  
  // アコーディオンの処理
  const accordionItems = document.querySelectorAll('.accordion-item');
  accordionItems.forEach(item => {
    const header = item.querySelector('.accordion-header');
    
    if (header) {
      header.addEventListener('click', function() {
        item.classList.toggle('active');
        
        // 他のアコーディオンを閉じる
        accordionItems.forEach(otherItem => {
          if (otherItem !== item) {
            otherItem.classList.remove('active');
          }
        });
      });
    }
  });
  
  
  
  // お問い合わせフォームの処理
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // フォームデータの取得
      const formData = new FormData(contactForm);
      const formValues = Object.fromEntries(formData.entries());
      
      // バリデーション
      let isValid = true;
      const requiredFields = ['name', 'email', 'subject', 'message'];
      
      requiredFields.forEach(field => {
        const input = document.getElementById(field);
        if (!formValues[field] || formValues[field].trim() === '') {
          isValid = false;
          input.style.borderColor = 'var(--danger)';
        } else {
          input.style.borderColor = '#eee';
        }
      });
      
      if (!isValid) {
        alert('必須項目を入力してください。');
        return;
      }
      
      // メール形式のバリデーション
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formValues.email)) {
        alert('有効なメールアドレスを入力してください。');
        document.getElementById('email').style.borderColor = 'var(--danger)';
        return;
      }
      
      // フォーム送信処理
      // 注: 実際の送信処理はサーバーサイドで実装する必要があります
      alert('お問い合わせありがとうございます。内容を確認の上、ご連絡いたします。');
      contactForm.reset();
    });
  }
  
  // FAQカテゴリー切り替え
  const faqCategories = document.querySelectorAll('.faq-category');
  const accordions = document.querySelectorAll('.accordion[id]');
  
  if (faqCategories.length > 0 && accordions.length > 0) {
    faqCategories.forEach(category => {
      category.addEventListener('click', function() {
        const targetId = this.getAttribute('data-category');
        
        // カテゴリの切り替え
        faqCategories.forEach(cat => cat.classList.remove('active'));
        this.classList.add('active');
        
        // アコーディオンの切り替え
        accordions.forEach(acc => {
          acc.style.display = 'none';
        });
        document.getElementById(targetId).style.display = 'block';
      });
    });
  }
  
  // FAQ検索機能
  const searchInput = document.getElementById('faqSearch');
  const searchBtn = document.getElementById('searchBtn');
  const searchResults = document.getElementById('searchResults');
  
  if (searchInput && searchBtn && searchResults) {
    searchBtn.addEventListener('click', searchFAQ);
    
    searchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        searchFAQ();
      }
    });
    
    function searchFAQ() {
      const query = searchInput.value.toLowerCase();
      if (query.length < 2) {
        searchResults.innerHTML = '<p>検索するには2文字以上入力してください。</p>';
        return;
      }
      
      const allQuestions = document.querySelectorAll('.accordion-header');
      const allAnswers = document.querySelectorAll('.accordion-body');
      
      let results = [];
      
      // 質問を検索
      allQuestions.forEach((question, index) => {
        const questionText = question.textContent.toLowerCase();
        if (index < allAnswers.length) {
          const answerText = allAnswers[index].textContent.toLowerCase();
          
          if (questionText.includes(query) || answerText.includes(query)) {
            results.push({
              question: question.textContent.replace('▼', '').trim(),
              answer: allAnswers[index].textContent
            });
          }
        }
      });
      
      // 結果を表示
      if (results.length > 0) {
        let resultsHTML = `<h3>${results.length}件の結果が見つかりました</h3>`;
        
        results.forEach(result => {
          resultsHTML += `
            <div class="search-result-item">
              <h4>${result.question}</h4>
              <p>${result.answer.substring(0, 150)}...</p>
            </div>
          `;
        });
        
        searchResults.innerHTML = resultsHTML;
      } else {
        searchResults.innerHTML = '<p>検索結果が見つかりませんでした。別のキーワードで試してみてください。</p>';
      }
    }
  }
  
  // ページ内リンクのスムーズスクロール
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        const headerHeight = document.querySelector('header').offsetHeight;
        const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight;
        
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
        
        // URLにアンカーを追加
        history.pushState(null, null, targetId);
      }
    });
  });
});

// 単位チェッカーのアニメーション用スクリプト（修正版）
document.addEventListener('DOMContentLoaded', function() {
  // すでに読み込み済みのscripts.jsの処理を実行した後に実行される
  
  // アニメーションのタイミング設定
  setTimeout(startCreditAnimation, 1500); // 少し長めの初期遅延
  
  // サンプルデータ（これは実際のデータではなくデモ用）
  const satisfiedData = {
    total: 112,
    required: 124,
    general: {
      count: 12,
      required: 14
    },
    foreign: {
      count: 10,
      required: 10
    },
    basic: {
      count: 16,
      required: 20
    },
    advanced: {
      count: 74,
      required: 80
    },
    requiredCourses: {
      count: 5,
      total: 7,
      remaining: ["卒業研究2", "卒業研究3"]
    },
    isGraduationPossible: false
  };
  
  // 推奨科目リスト（サンプル）
  const recommendedCourses = {
    required: ["卒業研究2", "卒業研究3"],
    basic: ["情報基礎数学", "数学4", "フーリエ解析", "物理1"],
    advanced: ["論理回路", "コンピュータネットワーク", "計算機構成論", "デジタル信号処理"]
  };

  // アニメーション開始
  function startCreditAnimation() {
    // ステータスの更新
    updateStatus("分析完了");
    
    // 単位状況パネルの表示
    showPanel('creditStatusPanel');
    
    // 単位数のアニメーション
    animateNumbers();
    
    // 2.5秒後にリボン表示
    setTimeout(function() {
      const ribbon = document.getElementById('statusRibbon');
      ribbon.textContent = satisfiedData.isGraduationPossible ? "卒業要件を満たしています" : "卒業要件を満たしていません";
      ribbon.style.backgroundColor = satisfiedData.isGraduationPossible ? "var(--success)" : "var(--warning)";
      ribbon.style.opacity = "1";
      
      // ステータスタイトルの更新
      document.getElementById('statusTitle').textContent = satisfiedData.isGraduationPossible ? 
        "単位取得状況（卒業可能）" : "単位取得状況（あと12単位）";
    }, 2500);
    
    // 6秒後に必修科目パネルに切り替え
    setTimeout(function() {
      hidePanel('creditStatusPanel');
      
      // 0.5秒の遅延を入れて滑らかに表示
      setTimeout(function() {
        showPanel('requiredCoursesPanel');
        animateRequiredCourses();
      }, 500);
    }, 6000);
    
    // 12秒後に推奨履修科目パネルに切り替え
    setTimeout(function() {
      hidePanel('requiredCoursesPanel');
      
      // 0.5秒の遅延を入れて滑らかに表示
      setTimeout(function() {
        showPanel('recommendedCoursesPanel');
        populateRecommendedCourses();
      }, 500);
    }, 12000);
    
    // 18秒後にアニメーションを最初から繰り返す
    setTimeout(function() {
      hidePanel('recommendedCoursesPanel');
      document.getElementById('statusRibbon').style.opacity = "0";
      
      // 1秒の遅延を入れてから次のサイクルを開始
      setTimeout(function() {
        resetAnimation();
        setTimeout(startCreditAnimation, 500);
      }, 1000);
    }, 18000);
  }
  
  // ステータス表示の更新
  function updateStatus(text) {
    const status = document.getElementById('demoStatus');
    status.textContent = text;
  }
  
  // パネル表示
  function showPanel(panelId) {
    const panel = document.getElementById(panelId);
    panel.classList.add('is-visible');
  }
  
  // パネル非表示
  function hidePanel(panelId) {
    const panel = document.getElementById(panelId);
    panel.classList.remove('is-visible');
  }
  
  // 数値アニメーション
  function animateNumbers() {
    // 円グラフのアニメーション
    const progressCircle = document.getElementById('progressCircle');
    const circumference = 2 * Math.PI * 45; // 2πr
    const offset = circumference - (satisfiedData.total / satisfiedData.required) * circumference;
    
    progressCircle.style.strokeDasharray = `${circumference} ${circumference}`;
    progressCircle.style.strokeDashoffset = circumference;
    
    // ゼロからアニメーション
    let count = 0;
    const countDuration = 2000; // ミリ秒 (少し長くして見やすく)
    const interval = 30; // ミリ秒ごとに更新
    const steps = countDuration / interval;
    const increment = satisfiedData.total / steps;
    
    const counter = setInterval(function() {
      count += increment;
      if (count >= satisfiedData.total) {
        count = satisfiedData.total;
        clearInterval(counter);
      }
      
      // カウント表示の更新
      document.getElementById('creditCount').textContent = Math.round(count);
      
      // 円グラフの更新
      const currentOffset = circumference - (count / satisfiedData.required) * circumference;
      progressCircle.style.strokeDashoffset = currentOffset;
      
      // 各カテゴリのプログレスバーを更新
      updateCategoryProgress('progressGeneral', 'generalCount', count / satisfiedData.total * satisfiedData.general.count, satisfiedData.general.count, satisfiedData.general.required);
      updateCategoryProgress('progressForeign', 'foreignCount', count / satisfiedData.total * satisfiedData.foreign.count, satisfiedData.foreign.count, satisfiedData.foreign.required);
      updateCategoryProgress('progressBasic', 'basicCount', count / satisfiedData.total * satisfiedData.basic.count, satisfiedData.basic.count, satisfiedData.basic.required);
      updateCategoryProgress('progressAdvanced', 'advancedCount', count / satisfiedData.total * satisfiedData.advanced.count, satisfiedData.advanced.count, satisfiedData.advanced.required);
      
    }, interval);
  }
  
  // カテゴリープログレスの更新
  function updateCategoryProgress(progressId, countId, currentCount, totalCount, requiredCount) {
    document.getElementById(progressId).style.width = `${(currentCount / requiredCount) * 100}%`;
    document.getElementById(countId).textContent = Math.round(currentCount);
  }
  
  // 必修科目アニメーション
  function animateRequiredCourses() {
    // プログレスバーのアニメーション
    const requiredProgress = document.getElementById('requiredProgress');
    requiredProgress.style.width = `${(satisfiedData.requiredCourses.count / satisfiedData.requiredCourses.total) * 100}%`;
    
    // カウントの表示
    document.getElementById('requiredCount').textContent = satisfiedData.requiredCourses.count;
    document.getElementById('requiredTotal').textContent = satisfiedData.requiredCourses.total;
    
    // 残りの必修科目リストの表示
    const requiredList = document.getElementById('requiredList');
    requiredList.innerHTML = ''; // リストのクリア
    
    // 少し遅延させて順番に表示
    satisfiedData.requiredCourses.remaining.forEach((course, index) => {
      setTimeout(() => {
        const li = document.createElement('li');
        li.textContent = course;
        requiredList.appendChild(li);
      }, index * 300); // 300msずつ遅延
    });
  }
  
  // 推奨履修科目の表示
  function populateRecommendedCourses() {
    // 必修科目リスト
    const requiredList = document.getElementById('recommendedRequiredList');
    requiredList.innerHTML = '';
    
    // 専門基礎科目リスト
    const basicList = document.getElementById('recommendedBasicList');
    basicList.innerHTML = '';
    
    // 専門科目リスト
    const advancedList = document.getElementById('recommendedAdvancedList');
    advancedList.innerHTML = '';
    
    // 各カテゴリを少し遅延させて表示
    setTimeout(() => {
      recommendedCourses.required.forEach((course, index) => {
        setTimeout(() => {
          const li = document.createElement('li');
          li.textContent = course;
          requiredList.appendChild(li);
        }, index * 200);
      });
    }, 300);
    
    setTimeout(() => {
      recommendedCourses.basic.forEach((course, index) => {
        setTimeout(() => {
          const li = document.createElement('li');
          li.textContent = course;
          basicList.appendChild(li);
        }, index * 150);
      });
    }, 800);
    
    setTimeout(() => {
      recommendedCourses.advanced.forEach((course, index) => {
        setTimeout(() => {
          const li = document.createElement('li');
          li.textContent = course;
          advancedList.appendChild(li);
        }, index * 150);
      });
    }, 1300);
  }
  
  // アニメーションのリセット
  function resetAnimation() {
    // カウンターのリセット
    document.getElementById('creditCount').textContent = '0';
    document.getElementById('generalCount').textContent = '0';
    document.getElementById('foreignCount').textContent = '0';
    document.getElementById('basicCount').textContent = '0';
    document.getElementById('advancedCount').textContent = '0';
    
    // プログレスバーのリセット
    document.getElementById('progressCircle').style.strokeDashoffset = '283';
    document.getElementById('progressGeneral').style.width = '0%';
    document.getElementById('progressForeign').style.width = '0%';
    document.getElementById('progressBasic').style.width = '0%';
    document.getElementById('progressAdvanced').style.width = '0%';
    
    // ステータスのリセット
    updateStatus("分析中...");
  }
});



document.addEventListener('DOMContentLoaded', function() {
  const contactForm = document.getElementById('contactForm');
  const formStatus = document.getElementById('formStatus');
  
  if (contactForm) {
    const scriptURL = 'https://script.google.com/macros/s/AKfycbzRN5aGFETWUiNC2K0_ECPY7URG4kpmcurvIz_RY_5AGaCghKLzaNRuBRbQQNl7FJcy/exec-+';
    
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // 送信ボタンを無効化して連打防止
      const submitBtn = contactForm.querySelector('.submit-btn');
      submitBtn.disabled = true;
      submitBtn.innerHTML = '送信中...';
      
      // フォームデータの取得
      const formData = new FormData(contactForm);
      
      // データのバリデーション
      let isValid = true;
      const requiredFields = ['username', 'faculty', 'subject', 'message'];
      
      requiredFields.forEach(field => {
        const input = document.getElementById(field);
        if (!formData.get(field) || formData.get(field).trim() === '') {
          isValid = false;
          input.style.borderColor = 'var(--danger)';
        } else {
          input.style.borderColor = '#eee';
        }
      });
      
      if (!isValid) {
        formStatus.innerHTML = '<p class="error-message">必須項目を入力してください。</p>';
        submitBtn.disabled = false;
        submitBtn.innerHTML = '送信する';
        return;
      }
      
      // 送信中のステータス表示
      formStatus.innerHTML = '<p class="info-message">送信中です。しばらくお待ちください...</p>';
      
      // Google Apps Scriptにフォームデータを送信
      fetch(scriptURL, {
        method: 'POST',
        mode: 'no-cors', // Google Apps Scriptは異なるオリジンからのリクエストを受け付けるため
        body: formData
      })
      .then(response => {
        // 送信成功表示
        formStatus.innerHTML = '<p class="success-message">お問い合わせありがとうございます。内容を確認いたします。</p>';
        contactForm.reset();
        submitBtn.disabled = false;
        submitBtn.innerHTML = '送信する';
        
        // 5秒後にステータスメッセージを消す
        setTimeout(() => {
          formStatus.innerHTML = '';
        }, 5000);
      })
      .catch(error => {
        // エラー表示
        formStatus.innerHTML = `<p class="error-message">送信中にエラーが発生しました。時間をおいて再度お試しください。</p>`;
        console.error('Error:', error);
        submitBtn.disabled = false;
        submitBtn.innerHTML = '送信する';
      });
    });
  }
});

// フォームステータス用のCSS
// styles.cssに追加する
/*
.form-status {
  margin: 1rem 0;
}

.success-message {
  color: var(--success);
  background-color: rgba(86, 171, 47, 0.1);
  border-left: 3px solid var(--success);
  padding: 0.8rem 1rem;
}

.error-message {
  color: var(--danger);
  background-color: rgba(255, 94, 98, 0.1);
  border-left: 3px solid var(--danger);
  padding: 0.8rem 1rem;
}

.info-message {
  color: var(--secondary);
  background-color: rgba(0, 123, 187, 0.1);
  border-left: 3px solid var(--secondary);
  padding: 0.8rem 1rem;
}
*/
