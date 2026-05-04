const bootScreen = document.getElementById('boot-screen');
const bootBar    = document.getElementById('boot-bar');
const bootStatus = document.getElementById('boot-status');
const mainUI     = document.getElementById('main-ui');

const bootSteps = [
    { pct: 15,  msg: 'ИНИЦИАЛИЗАЦИЯ ЯДРА...',     delay: 350 },
    { pct: 32,  msg: 'ЗАГРУЗКА МАТРИЦ ШИФРОВАНИЯ...',        delay: 420 },
    { pct: 55,  msg: 'КАЛИБРОВКА ДУГОВОЙ РЕАКЦИИ...',        delay: 380 },
    { pct: 74,  msg: 'УСТАНОВКА ЗАЩИЩЁННОГО КАНАЛА...',       delay: 450 },
    { pct: 90,  msg: 'ПРОВЕРКА ПРОТОКОЛОВ КОНВЕРТАЦИИ...',    delay: 340 },
    { pct: 100, msg: 'M0ON CONVERTER — ГОТОВ.',                     delay: 300 },
];

async function runBoot() {
    await delay(600);

    for (const step of bootSteps) {
        bootBar.style.width = step.pct + '%';
        bootStatus.textContent = step.msg;
        await delay(step.delay);
    }

    await delay(500);

    bootScreen.classList.add('hidden');

    mainUI.style.pointerEvents = 'auto';
    mainUI.style.opacity = '1';

    document.querySelector('.window-controls').classList.add('visible');

    setTimeout(() => bootScreen.remove(), 800);
}

runBoot();

document.addEventListener('DOMContentLoaded', () => {
    const initBtn      = document.getElementById('init-btn');
    const xmlInput     = document.getElementById('xml-path');
    const browseBtn    = document.getElementById('browse-btn');
    const progressWrap = document.getElementById('progress-wrap');
    const progressFill = document.getElementById('progress-fill');
    const resultBox    = document.getElementById('result-box');
    const resultIcon   = document.getElementById('result-icon');
    const resultText   = document.getElementById('result-text');
    const resultPath   = document.getElementById('result-path');
    const statusMsg    = document.getElementById('status-msg');

    browseBtn.addEventListener('click', async () => {
        try {
            const path = await window.starkCore.openFileDialog();
            
            if (path) {
                xmlInput.value = path;
                initBtn.disabled = false;
                setStatus(statusMsg, 'idle', '◈', 'Файл выбран. Нажмите «Запустить конвертацию».');
                resultBox.style.display = 'none';
            }
        } catch (e) {
            setStatus(statusMsg, 'err', '✕', 'Ошибка открытия диалога.');
        }
    });

initBtn.addEventListener('click', async () => {
    const path = xmlInput.value.trim();
    if (!path) return;

    initBtn.disabled  = true;
    browseBtn.disabled = true;
    resultBox.style.display = 'none';

    setStatus(statusMsg, 'running', '⟳', 'Конвертация...');
    showProgress(progressWrap, progressFill, true);

    try {
        await animateProgress(progressFill, [25, 55, 85]);
        const result = await window.starkCore.initializeConversion(path);
        
        await animateProgress(progressFill, [100]);
        showProgress(progressWrap, progressFill, false);
        showResult(resultBox, resultIcon, resultText, resultPath, true, 'КОНВЕРТАЦИЯ ЗАВЕРШЕНА', result);
        setStatus(statusMsg, 'ok', '✓', 'Успешно сконвертировано!');
        
    } catch (err) {
        showProgress(progressWrap, progressFill, false);
        showResult(resultBox, resultIcon, resultText, resultPath, false, 'ОШИБКА КОНВЕРТАЦИИ', err || 'Неизвестная ошибка');
        setStatus(statusMsg, 'err', '✕', 'Произошла ошибка. Проверьте файл.');
    } finally {
        initBtn.disabled   = false;
        browseBtn.disabled = false;
    }
});

    document.getElementById('minimize-btn').addEventListener('click', () => {
        if (window.electronAPI) {
            window.electronAPI.minimize();
        }
    });

    document.getElementById('close-btn').addEventListener('click', () => {
        if (window.electronAPI) {
            window.electronAPI.close();
        }
    });

});

function setStatus(statusMsg, type, icon, text) {
    const cls = { idle:'status-idle', running:'status-running', ok:'status-ok', err:'status-err' }[type];
    statusMsg.className = cls;
    statusMsg.innerHTML = `<span class="status-icon">${icon}</span>${text}`;
}

function showProgress(progressWrap, progressFill, visible) {
    progressWrap.style.display = visible ? 'block' : 'none';
    if (!visible) progressFill.style.width = '0%';
}

async function animateProgress(progressFill, steps) {
    for (const w of steps) {
        progressFill.style.width = w + '%';
        await delay(320 + Math.random() * 180);
    }
}

function showResult(resultBox, resultIcon, resultText, resultPath, success, title, path) {
    resultBox.style.display = 'flex';
    resultBox.className = success ? 'result-box' : 'result-box error';
    resultIcon.textContent = success ? '✓' : '✕';
    resultText.textContent = title;
    resultPath.textContent = path;
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
