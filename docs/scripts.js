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