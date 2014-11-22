/**
 * Created by Julian on 11/22/2014.
 */
window.Handshake = (function () {

    var ICE_CONFIG = {"iceServers":[{"url":"stun:23.21.150.121"}]};
    var CONN = { 'optional': [{'DtlsSrtpKeyAgreement': true}] };

    function Peer() {
        var pc = new RTCPeerConnection(ICE_CONFIG, CONN);
        this.pc = pc;
        this.dc = null;
        this.offerCallback = null;
        this.createCallback = null;
        var self = this;
        pc.onicecandidate = function (e) {
            if (e.candidate === null) {
                var d = JSON.stringify(pc.localDescription);
                if (self.offerCallback !== null) {
                    self.offerCallback.call(self, d);
                    self.offerCallback = null;
                } else if (self.createCallback !== null) {
                    self.createCallback.call(self, d);
                    self.createCallback = null;
                }
            }
        };
    }



    /* ====================================
                A P I
     ==================================== */

    function createOffer(callback) {
        var peer = new Peer(), pc = peer.pc;
        peer.offerCallback = callback;

        var dc = pc.createDataChannel("q", {reliable:true});
        pc.createOffer(function (desc) {
            pc.setLocalDescription(desc, function() { });
        }, function failure(e) { console.error(e); });

        dc.onopen = function () {
            console.log("-> open");
        };
        peer.dc = dc;

        return peer;
    }

    function handleAnswer(peer, answer) {
        var answerDesc = new RTCSessionDescription(JSON.parse(answer));
        peer.pc.setRemoteDescription(answerDesc);
    }

    function createAnswer(offer, callback) {
        var peer = new Peer(), pc = peer.pc;
        var offerDesc = new RTCSessionDescription(JSON.parse(offer));
        peer.createCallback = callback;
        pc.setRemoteDescription(offerDesc);
        pc.createAnswer(function (answerDesc) {
            pc.setLocalDescription(answerDesc);
        }, function () { console.warn("No create answer"); });

        pc.ondatachannel = function (e) {
            var dc = e.channel || e; // Chrome sends event, FF sends raw channel
            peer.dc = dc;

            dc.onopen = function () {
                console.log("<- open!");
            };

        };
    }

    /* ====================================
                A P I
     ==================================== */

    return {
        createOffer: createOffer,
        handleAnswer: handleAnswer,
        createAnswer: createAnswer
    };
})();