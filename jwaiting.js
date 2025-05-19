(() => {
    const frameId = 'mainFrame';
    let observer = null;
    let mutationTimeout = null;
    let lastProcessTime = 0;
    const PROCESS_INTERVAL = 1000; // 최소 처리 간격 (1초)
    const DEBOUNCE_DELAY = 500; // 디바운스 지연 시간 (0.5초)

    // DOM이 준비되었는지 확인하는 함수
    function waitForElement(iframeDoc, selector, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            
            const checkElement = () => {
                const element = iframeDoc.querySelector(selector);
                if (element) {
                    resolve(element);
                    return;
                }
                
                if (Date.now() - startTime >= timeout) {
                    reject(new Error(`Element ${selector} not found after ${timeout}ms`));
                    return;
                }
                
                setTimeout(checkElement, 100);
            };
            
            checkElement();
        });
    }

    // 대기 버튼 HTML 생성
    const waitingButtonsHTML = `
        <ul style="margin: 0; padding: 0;">
            <li style="display:inline-block; margin: 2px;"><span class="nBtn line jwaiting" style="cursor: pointer; display: inline-block; padding: 2px 8px; border: 1px solid #ccc; border-radius: 3px;">재희W</span></li>
            <li style="display:inline-block; margin: 2px;"><span class="nBtn line jwaiting" style="cursor: pointer; display: inline-block; padding: 2px 8px; border: 1px solid #ccc; border-radius: 3px;">광숙W</span></li>
            <li style="display:inline-block; margin: 2px;"><span class="nBtn line jwaiting" style="cursor: pointer; display: inline-block; padding: 2px 8px; border: 1px solid #ccc; border-radius: 3px;">지후W</span></li>
            <li style="display:inline-block; margin: 2px;"><span class="nBtn line jwaiting" style="cursor: pointer; display: inline-block; padding: 2px 8px; border: 1px solid #ccc; border-radius: 3px;">현진W</span></li>
            <li style="display:inline-block; margin: 2px;"><span class="nBtn line jwaiting" style="cursor: pointer; display: inline-block; padding: 2px 8px; border: 1px solid #ccc; border-radius: 3px;">예나W</span></li>
            <li style="display:inline-block; margin: 2px;"><span class="nBtn line jwaiting" style="cursor: pointer; display: inline-block; padding: 2px 8px; border: 1px solid #ccc; border-radius: 3px;">시은W</span></li>
            <li style="display:inline-block; margin: 2px;"><span class="nBtn line jwaiting" style="cursor: pointer; display: inline-block; padding: 2px 8px; border: 1px solid #ccc; border-radius: 3px;">윤진W</span></li>
            <li style="display:inline-block; margin: 2px;"><span class="nBtn line jwaiting" style="cursor: pointer; display: inline-block; padding: 2px 8px; border: 1px solid #ccc; border-radius: 3px;">정현W</span></li>
            <li style="display:inline-block; margin: 2px;"><span class="nBtn line jwaiting" style="cursor: pointer; display: inline-block; padding: 2px 8px; border: 1px solid #ccc; border-radius: 3px;">희선W</span></li>
            <li style="display:inline-block; margin: 2px;"><span class="nBtn line jwaiting" style="cursor: pointer; display: inline-block; padding: 2px 8px; border: 1px solid #ccc; border-radius: 3px;">희진W</span></li>
            <li style="display:inline-block; margin: 2px;"><span class="nBtn line jwaiting" style="cursor: pointer; display: inline-block; padding: 2px 8px; border: 1px solid #ccc; border-radius: 3px;">소이W</span></li>
            <li style="display:inline-block; margin: 2px;"><span class="nBtn line jwaiting" style="cursor: pointer; display: inline-block; padding: 2px 8px; border: 1px solid #ccc; border-radius: 3px;">소연W</span></li>
            <li style="display:inline-block; margin: 2px;"><span class="nBtn line jwaiting" style="cursor: pointer; display: inline-block; padding: 2px 8px; border: 1px solid #ccc; border-radius: 3px;">재열W</span></li>
        </ul>
    `;

    // iframe 내부 문서를 처리하는 함수
    function processIframe(iframeDoc) {
        if (!iframeDoc) {
            console.warn('❌ iframe 내부 문서 접근 불가');
            return;
        }

        // cashReceiptLayer div 찾기
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

        // 부모 요소의 자식들 중에서 table 찾기
        const targetTable = Array.from(parentElement.children).find(element => 
            element.tagName === 'TABLE' && element !== cashReceiptLayer
        );

        if (!targetTable) {
            console.log('❌ cashReceiptLayer의 형제 테이블을 찾을 수 없습니다.');
            return;
        }

        console.log('✅ 지정된 위치의 테이블을 찾았습니다.');

        // 이미 버튼이 추가되었는지 확인
        if (targetTable.dataset.buttonsAdded === 'true') {
            console.log('ℹ️ 이미 버튼이 추가되어 있습니다.');
            return;
        }

        // 버튼 추가
        targetTable.insertAdjacentHTML('beforeend', waitingButtonsHTML);
        targetTable.dataset.buttonsAdded = 'true';
        console.log('✅ 대기 버튼들이 추가되었습니다.');

        // 버튼 이벤트 리스너 등록
        const buttons = iframeDoc.querySelectorAll('.nBtn.line.jwaiting');
        buttons.forEach(button => {
            // 이미 처리된 버튼인지 확인
            if (button.dataset.waitingProcessed === 'true') {
                return;
            }
            button.dataset.waitingProcessed = 'true';

            button.addEventListener('click', async (e) => {
                e.preventDefault(); // 기본 동작 방지
                const btnText = button.innerText.trim(); // 예: 조재희W
                console.log(`✅ 대기 버튼 클릭: ${btnText}`);

                try {
                    // 1. linkSelectCateg_Change td 찾기
                    const categoryTd = await waitForElement(iframeDoc, 'td.tal.tind[onclick="linkSelectCateg_Change(this);"]');
                    console.log('✅ linkSelectCateg_Change td 발견');
                    categoryTd.click();

                    // 2. 시술전 td 찾기
                    const targetTd = await waitForElement(iframeDoc, 'td[onclick*="categChange"][onclick*="시술전"]');
                    console.log('✅ 시술전 td 발견');
                    targetTd.click();

                    // 3. 시술중 td 찾기
                    const m2Td = await waitForElement(iframeDoc, 'td.m2[id*="시술중"]');
                    console.log('✅ 시술중 td 발견');
                    m2Td.click();

                    // 4. textarea 찾기
                    const textarea = iframeDoc.getElementById('strMemo');
                    if (textarea) {
                        // 기존 텍스트를 유지하면서 새로운 메모 형식 추가
                        textarea.value = textarea.value + `\n\n1.\n2.${btnText}\n3.\n4.`;
                        console.log('✅ 메모가 업데이트되었습니다.');
                    } else {
                        console.error('❌ textarea#strMemo를 찾을 수 없습니다.');
                    }

                    console.log('✅ 모든 작업이 완료되었습니다.');

                } catch (err) {
                    console.error('❌ 작업 처리 중 오류:', err);
                }
            });

            console.log(`✅ 대기 버튼 이벤트 리스너가 등록되었습니다: ${button.innerText.trim()}`);
        });
    }

    // 변경 감지 처리 (디바운싱 적용)
    function processMutations() {
        if (mutationTimeout) clearTimeout(mutationTimeout);
        mutationTimeout = setTimeout(() => {
            const now = Date.now();
            if (now - lastProcessTime >= PROCESS_INTERVAL) {
                try {
                    const iframe = document.getElementById(frameId);
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

    // iframe 문서 감시 초기화
    function initializeObserver() {
        const frame = document.getElementById(frameId);
        if (frame && frame.contentDocument && frame.contentDocument.body) {
            if (observer) observer.disconnect();

            observer = new MutationObserver(processMutations);
            observer.observe(frame.contentDocument.body, {
                childList: true,
                subtree: true,
                characterData: true,
                attributes: true
            });

            console.log('✅ Mutation Observer가 (재)시작되었습니다.');
            processIframe(frame.contentDocument);
        } else {
            console.warn('⚠️ iframe 내부 문서 또는 body에 접근할 수 없습니다.');
        }
    }

    // iframe 로드 완료 시 observer 초기화
    const frameElement = document.getElementById(frameId);
    if (frameElement) {
        frameElement.addEventListener('load', initializeObserver);

        if (frameElement.contentDocument?.readyState === 'complete') {
            initializeObserver();
        }
    } else {
        console.error('❌ mainFrame 요소를 찾을 수 없습니다.');
    }

    // window 로드 시 초기화 백업
    if (document.readyState === 'complete') {
        initializeObserver();
    } else {
        window.addEventListener('load', () => {
            const frame = document.getElementById(frameId);
            if (frame?.contentDocument?.readyState === 'complete') {
                initializeObserver();
            } else {
                setTimeout(initializeObserver, 500);
            }
        });
    }
})();

