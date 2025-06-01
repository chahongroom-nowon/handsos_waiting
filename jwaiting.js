/**
 * [사용자 참고]
 * - 이 스크립트는 handsos 예약표(mainFrame) iframe 내부에 "대기" 버튼을 자동으로 추가합니다.
 * - 버튼을 누르면 예약 메모에 담당자명(예: "재희W")이 자동으로 입력됩니다.
 * - 버튼, 담당자명, 입력 포맷 등은 아래 코드에서 쉽게 수정할 수 있습니다.
 * - js를 잘 모르는 분도, 아래 주석과 변수만 수정하면 원하는 동작을 쉽게 바꿀 수 있습니다.
 */

(() => {
    // [1] handsos 예약표 iframe의 id
    const FRAME_ID = 'mainFrame';

    // [2] MutationObserver 및 디바운싱 관련 변수
    let observer = null;           // MutationObserver 인스턴스
    let mutationTimeout = null;    // 디바운싱 타이머
    let lastProcessTime = 0;       // 마지막 처리 시각
    const PROCESS_INTERVAL = 1000; // 최소 처리 간격(ms)
    const DEBOUNCE_DELAY = 500;    // 디바운스 지연(ms)

    /**
     * [3] 특정 요소가 DOM에 나타날 때까지 대기 (비동기)
     * @param {Document} iframeDoc - iframe 내부 document 객체
     * @param {string} selector - 찾을 요소의 CSS 선택자
     * @param {number} timeout - 최대 대기 시간(ms)
     * @returns {Promise<Element>}
     */
    function waitForElement(iframeDoc, selector, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const start = Date.now();
            function check() {
                const el = iframeDoc.querySelector(selector);
                if (el) {
                    resolve(el);
                    return;
                }
                if (Date.now() - start >= timeout) {
                    reject(new Error(`요소(${selector})를 ${timeout}ms 내에 찾지 못했습니다.`));
                    return;
                }
                setTimeout(check, 100);
            }
            check();
        });
    }

    /**
     * [4] 대기 버튼 HTML 템플릿
     * - 아래 배열에 담당자명을 추가/삭제하면 버튼이 자동으로 바뀝니다.
     */
    const waitingNames = [
        "재희W", "광숙W", "지후W", 
        "시은W", "윤진W", "정현W",
        "희선W", "희진W", "소이W", 
        "소연W", "재열W"
    ];
    const waitingButtonsHTML = `
         <ul style="margin:0; padding:0;">
        ${waitingNames.reduce((html, name, idx) => {
            if (idx % 3 === 0) {
                html += '<li style="display:block; margin:4px 0;">';
            }
            html += `
                <span class="nBtn line jwaiting"
                    style="cursor:pointer; display:inline-block; padding:2px 8px; border:1px solid #ccc; border-radius:3px; margin-right:4px;">
                    ${name}
                </span>
            `;
            if (idx % 3 === 2 || idx === waitingNames.length - 1) {
                html += '</li>';
            }
            return html;
        }, '')}
    </ul>
    `;

    /**
     * [5] iframe 내부에 대기 버튼을 추가하고 이벤트를 바인딩
     * @param {Document} iframeDoc
     */
    function processIframe(iframeDoc) {
        if (!iframeDoc) {
            console.warn('❌ iframe 내부 문서 접근 불가');
            return;
        }

        // cashReceiptLayer div 찾기 (버튼을 붙일 기준 위치)
        const cashReceiptLayer = iframeDoc.querySelector('div#cashReceiptLayer');
        if (!cashReceiptLayer) {
            console.log('❌ cashReceiptLayer를 찾을 수 없습니다.');
            return;
        }

        // cashReceiptLayer의 부모 요소 찾기
        const parentElement = cashReceiptLayer.parentElement;
        if (!parentElement) {
            console.log('❌ cashReceiptLayer의 부모 요소를 찾을 수 없습니다.');
            return;
        }

        // cashReceiptLayer의 형제 테이블 찾기 (버튼을 붙일 곳)
        const targetTable = Array.from(parentElement.children).find(
            el => el.tagName === 'TABLE' && el !== cashReceiptLayer
        );
        if (!targetTable) {
            console.log('❌ cashReceiptLayer의 형제 테이블을 찾을 수 없습니다.');
            return;
        }

        // 이미 버튼이 추가되었는지 확인 (중복 방지)
        if (targetTable.dataset.buttonsAdded === 'true') {
            // 이미 추가된 경우는 무시
            return;
        }

        // 버튼 HTML 추가
        targetTable.insertAdjacentHTML('beforeend', waitingButtonsHTML);
        targetTable.dataset.buttonsAdded = 'true';

        // 버튼 이벤트 리스너 등록
        const buttons = iframeDoc.querySelectorAll('.nBtn.line.jwaiting');
        buttons.forEach(button => {
            if (button.dataset.waitingProcessed === 'true') return;
            button.dataset.waitingProcessed = 'true';

            button.addEventListener('click', async (e) => {
                e.preventDefault();
                const btnText = button.innerText.trim();

                try {
                    // 1. 카테고리 선택 td 클릭
                    const categoryTd = await waitForElement(
                        iframeDoc,
                        'td.tal.tind[onclick="linkSelectCateg_Change(this);"]'
                    );
                    categoryTd.click();

                    // 2. "시술전" td 클릭
                    const targetTd = await waitForElement(
                        iframeDoc,
                        'td[onclick*="categChange"][onclick*="시술전"]'
                    );
                    targetTd.click();

                    // 3. "시술중" td 클릭
                    const m2Td = await waitForElement(
                        iframeDoc,
                        'td.m2[id*="시술중"]'
                    );
                    m2Td.click();

                    // 4. 메모 textarea에 텍스트 추가
                    const textarea = iframeDoc.getElementById('strMemo');
                    if (textarea) {
                        // 아래 포맷을 원하는 대로 수정 가능
                        textarea.value = textarea.value + `\n\n1.\n2.${btnText}\n3.\n4.`;
                    } else {
                        console.error('❌ textarea#strMemo를 찾을 수 없습니다.');
                    }
                } catch (err) {
                    console.error('❌ 작업 처리 중 오류:', err);
                }
            });
        });
    }

    /**
     * [6] DOM 변경 감지 시 처리 (디바운싱 적용)
     * - 여러 번 변경이 일어나도 일정 시간 후 한 번만 처리
     */
    function processMutations() {
        if (mutationTimeout) clearTimeout(mutationTimeout);
        mutationTimeout = setTimeout(() => {
            const now = Date.now();
            if (now - lastProcessTime >= PROCESS_INTERVAL) {
                try {
                    const iframe = document.getElementById(FRAME_ID);
                    if (iframe && (iframe.contentDocument || iframe.contentWindow.document)) {
                        processIframe(iframe.contentDocument || iframe.contentWindow.document);
                        lastProcessTime = now;
                    }
                } catch (err) {
                    console.error("❌ processIframe() 실행 중 오류:", err);
                }
            }
        }, DEBOUNCE_DELAY);
    }

    /**
     * [7] iframe 내부 문서에 MutationObserver 등록
     * - DOM이 변경될 때마다 processMutations 실행
     */
    function initializeObserver() {
        const frame = document.getElementById(FRAME_ID);
        if (frame && frame.contentDocument && frame.contentDocument.body) {
            if (observer) observer.disconnect();

            observer = new MutationObserver(processMutations);
            observer.observe(frame.contentDocument.body, {
                childList: true,
                subtree: true,
                characterData: true,
                attributes: true
            });

            processIframe(frame.contentDocument);
        } else {
            console.warn('⚠️ iframe 내부 문서 또는 body에 접근할 수 없습니다.');
        }
    }

    // [8] iframe 로드 시 MutationObserver 초기화
    const frameElement = document.getElementById(FRAME_ID);
    if (frameElement) {
        frameElement.addEventListener('load', initializeObserver);

        // 이미 로드된 경우 즉시 처리
        if (frameElement.contentDocument?.readyState === 'complete') {
            initializeObserver();
        }
    } else {
        console.error('❌ mainFrame 요소를 찾을 수 없습니다.');
    }

    // [9] window 로드 시 백업 초기화
    if (document.readyState === 'complete') {
        initializeObserver();
    } else {
        window.addEventListener('load', () => {
            const frame = document.getElementById(FRAME_ID);
            if (frame?.contentDocument?.readyState === 'complete') {
                initializeObserver();
            } else {
                setTimeout(initializeObserver, 500);
            }
        });
    }
})();

/*
─────────────────────────────────────────────
[사용자 참고]
- waitingNames 배열에 담당자명을 추가/삭제하면 버튼이 자동으로 바뀝니다.
- 버튼을 눌렀을 때 입력되는 메모 포맷은 processIframe 함수 내에서 수정할 수 있습니다.
- 코드 내 주석을 참고해 원하는 동작을 쉽게 바꿀 수 있습니다.
─────────────────────────────────────────────
*/

