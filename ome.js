(() => {
    const apiKey = 'API_KEY';
    let currentIP = null;

    // Create floating UI box once
    let box = document.getElementById('ip-box');
    if (!box) {
        box = document.createElement('div');
        box.id = 'ip-box';
        box.style = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 300px;
            max-height: 400px;
            overflow-y: auto;
            background: white;
            color: black;
            padding: 10px;
            border: 2px solid #444;
            border-radius: 8px;
            font-family: sans-serif;
            font-size: 14px;
            box-shadow: 0 0 10px rgba(0,0,0,0.3);
            z-index: 9999;
        `;
        box.innerHTML = `<strong>🌍 IP Geolocation Data</strong><br><div id="geo-info"></div>`;
        document.body.appendChild(box);

        // Make draggable
        box.onmousedown = function (e) {
            let shiftX = e.clientX - box.getBoundingClientRect().left;
            let shiftY = e.clientY - box.getBoundingClientRect().top;

            function moveAt(pageX, pageY) {
                box.style.left = pageX - shiftX + 'px';
                box.style.top = pageY - shiftY + 'px';
                box.style.right = 'auto';
            }

            function onMouseMove(e) {
                moveAt(e.pageX, e.pageY);
            }

            document.addEventListener('mousemove', onMouseMove);
            box.onmouseup = function () {
                document.removeEventListener('mousemove', onMouseMove);
                box.onmouseup = null;
            };
        };
        box.ondragstart = () => false;
    }

    // Hook WebRTC
    window.oRTCPeerConnection = window.oRTCPeerConnection || window.RTCPeerConnection;
    window.RTCPeerConnection = function (...args) {
        const pc = new window.oRTCPeerConnection(...args);
        pc.oaddIceCandidate = pc.addIceCandidate;

        pc.addIceCandidate = function (iceCandidate, ...rest) {
            try {
                const candidate = iceCandidate?.candidate;
                if (candidate && candidate.includes("srflx")) {
                    const parts = candidate.split(" ");
                    const ip = parts[4];
                    if (ip !== currentIP) {
                        currentIP = ip;
                        fetch(`https://api.ipgeolocation.io/ipgeo?apiKey=${apiKey}&ip=${ip}`)
                            .then(res => res.json())
                            .then(data => {
                                const infoHTML = `
                                    <div style="margin: 5px 0; padding: 5px; border: 1px solid #ccc; border-radius: 5px;">
                                        <strong>IP:</strong> ${ip}<br>
                                        <strong>Country:</strong> ${data.country_name}<br>
                                        <strong>Province:</strong> ${data.state_prov}<br>
                                        <strong>City:</strong> ${data.city}<br>
                                        <strong>District:</strong> ${data.district}<br>
                                        <strong>ISP:</strong> ${data.isp}
                                    </div>
                                `;
                                document.getElementById('geo-info').innerHTML = infoHTML;

                                console.table({
                                    IP: ip,
                                    Country: data.country_name,
                                    City: data.city,
                                    ISP: data.isp
                                });
                            })
                            .catch(err => console.error("Geo lookup failed:", err));
                    }
                }
            } catch (e) {
                console.warn("Error processing ICE candidate:", e);
            }
            return pc.oaddIceCandidate(iceCandidate, ...rest);
        };

        return pc;
    };

    console.log("✅ IP geolocation hook updated: Only one person shown at a time.");
})();
