// The deployed Apps Script URL is public; Google credentials never enter this app.
export const GOOGLE_ENDPOINT = 'https://script.google.com/macros/s/AKfycbzFDKI99wchxgQNmSvcCFPEkwpX8sbPHgumrPbkxvbfsuCRpfBwqhso5PtylU6RP7jdIA/exec';
export function loadResults() {
    return new Promise((resolve, reject) => {
        if (!GOOGLE_ENDPOINT) {
            reject(Error('Подключение Google Таблицы ещё не завершено'));
            return;
        }
        const callback = 'sitesPoll_' + crypto.randomUUID().replaceAll('-', '');
        const script = document.createElement('script');
        const callbacks = window;
        const cleanup = () => { clearTimeout(timer); script.remove(); delete callbacks[callback]; };
        const timer = setTimeout(() => { script.remove(); callbacks[callback] = () => { delete callbacks[callback]; }; setTimeout(() => { delete callbacks[callback]; }, 300000); reject(Error('Не удалось загрузить результаты. Нажмите «Обновить».')); }, 60000);
        callbacks[callback] = (data) => { cleanup(); if (data.error)
            reject(Error(data.error));
        else
            resolve(data); };
        script.onerror = () => { cleanup(); reject(Error('Не удалось загрузить результаты')); };
        script.src = GOOGLE_ENDPOINT + '?callback=' + callback;
        document.body.append(script);
    });
}
export function saveAnswers(id, answers) {
    return new Promise((resolve, reject) => {
        if (!GOOGLE_ENDPOINT) {
            reject(Error('Подключение Google Таблицы ещё не завершено'));
            return;
        }
        const requestId = 'r' + crypto.randomUUID().replaceAll('-', '');
        const frame = document.createElement('iframe');
        frame.hidden = true;
        frame.name = requestId;
        const form = document.createElement('form');
        form.hidden = true;
        form.method = 'POST';
        form.action = GOOGLE_ENDPOINT;
        form.target = requestId;
        const input = document.createElement('input');
        input.name = 'payload';
        input.value = JSON.stringify({ id, answers, requestId });
        form.append(input);
        const cleanup = () => { clearTimeout(timer); window.removeEventListener('message', receive); form.remove(); frame.remove(); };
        const receive = (e) => { if (!/^https:\/\/[a-z0-9-]+\.googleusercontent\.com$/.test(e.origin) || e.data?.type !== 'sites-poll-saved' || e.data?.requestId !== requestId)
            return; cleanup(); if (e.data.saved === true)
            resolve();
        else
            reject(Error(e.data.error || 'Не удалось сохранить ответы')); };
        const timer = setTimeout(() => { cleanup(); reject(Error('Нет подтверждения сохранения. Повторите отправку.')); }, 45000);
        window.addEventListener('message', receive);
        document.body.append(frame, form);
        form.submit();
    });
}
