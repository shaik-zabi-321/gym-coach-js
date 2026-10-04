import streamlit.components.v1 as components


def inject_webrtc_styles():
    """
    streamlit-webrtc renders its controls inside a separate iframe
    (its own document, own <head>) so page-level CSS never reaches it.
    This reaches into that iframe and patches it directly to match
    the Iron Yard theme: Oswald for buttons, rust accent, square corners.
    """
    components.html(
        """
        <script>
        (function patchWebRTCStyles() {
            const FONT_LINK_HREF =
                "https://fonts.googleapis.com/css2?family=Oswald:wght@500;600&display=swap";

            function injectIntoIframe(iframe) {
                try {
                    const doc = iframe.contentDocument || iframe.contentWindow.document;
                    if (!doc || !doc.head) return;
                    if (doc.head.querySelector('#webrtc-custom-styles')) return;

                    // Load Oswald the normal way -- a <link>, not an
                    // embedded file, since it's not a local binary.
                    const link = doc.createElement('link');
                    link.id = 'webrtc-custom-font';
                    link.rel = 'stylesheet';
                    link.href = FONT_LINK_HREF;
                    doc.head.appendChild(link);

                    const style = doc.createElement('style');
                    style.id = 'webrtc-custom-styles';
                    style.textContent = `
                        .MuiButtonBase-root,
                        .MuiButton-root,
                        .MuiButton-contained,
                        .MuiButton-text {
                            border-radius: 0 !important;
                            font-family: 'Oswald', sans-serif !important;
                            font-weight: 500 !important;
                            letter-spacing: 0.02em !important;
                        }
                        /* Primary/contained action -> rust, matching
                           the rest of the app's button[kind="primary"] */
                        .MuiButton-contained {
                            background-color: #B8551F !important;
                            color: #0A0D14 !important;
                            border: 1px solid #B8551F !important;
                        }
                        .MuiButton-contained:hover {
                            background-color: #8C4419 !important;
                            border-color: #8C4419 !important;
                        }
                        /* Secondary/text buttons -> quiet concrete */
                        .MuiButton-text {
                            color: #E8E4DC !important;
                        }
                    `;
                    doc.head.appendChild(style);
                } catch (e) {
                    console.warn('[patcher] could not inject:', e);
                }
            }

            function findAndPatch() {
                const parentDoc = window.parent.document;
                const iframes = parentDoc.querySelectorAll('iframe');
                iframes.forEach(iframe => {
                    if (iframe.src && iframe.src.includes('webrtc')) {
                        if (iframe.contentDocument && iframe.contentDocument.readyState === 'complete') {
                            injectIntoIframe(iframe);
                        } else {
                            iframe.addEventListener('load', () => injectIntoIframe(iframe));
                        }
                    }
                });
            }

            findAndPatch();
        })();
        </script>
        """,
        height=0,
    )
