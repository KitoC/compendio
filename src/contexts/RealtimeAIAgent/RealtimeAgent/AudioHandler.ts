export class AudioHandler {
  private pc: RTCPeerConnection;
  private audioEl: HTMLMediaElement;
  private ms: MediaStream;
  private sender: RTCRtpSender;

  constructor(pc: RTCPeerConnection) {
    this.pc = pc; // RTCPeerConnection
    this.audioEl = null;
    this.ms = null; // Local MediaStream
    this.sender = null; // RTCRtpSender for audio
  }

  setPC(pc: RTCPeerConnection) {
    this.pc = pc;
  }

  async startAudioCapture() {
    this.audioEl = document.createElement("audio");
    this.audioEl.autoplay = true;

    this.ms = await navigator.mediaDevices.getUserMedia({ audio: true });
    const track = this.ms.getAudioTracks()[0];

    // Add track and save sender
    this.sender = this.pc.addTrack(track, this.ms);

    // For playing remote audio
    this.pc.ontrack = (e) => {
      const [stream] = e.streams;
      this.audioEl.srcObject = stream;
    };
  }

  async muteAudio() {
    if (this.sender?.track) {
      // Stop the track to release the mic
      this.sender.track.stop();

      // Replace with null to indicate muted
      await this.sender.replaceTrack(null);
    }
  }

  async unmuteAudio() {
    const newStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });
    const newTrack = newStream.getAudioTracks()[0];

    this.ms = newStream; // Save the new stream

    // Replace the track in the existing sender
    if (this.sender) {
      await this.sender.replaceTrack(newTrack);
    } else {
      // Fallback: add track if sender is not set (initial case)
      this.sender = this.pc.addTrack(newTrack, newStream);
    }
  }

  stopAudioCapture() {
    if (this.ms) {
      this.ms.getTracks().forEach((track) => track.stop());
      this.ms = null;
    }

    if (this.sender && this.pc.connectionState === "connected") {
      this.pc.removeTrack(this.sender);
      this.sender = null;
    }
  }
}
