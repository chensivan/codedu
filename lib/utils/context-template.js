module.exports = function(params, tooltip) {
  return `
    <div style="width:180px;height:100px;background: #41BB5A; font-weight:bold" class="request-button-wrapper native-key-bindings">
      <input id='code-codecontextbox-${tooltip.myId}'></input>
      <p class="requestbuttonclose" style='float: right' id="__codecontextbox-${tooltip.myId}">Send</p>
    </div>
  `;
};
