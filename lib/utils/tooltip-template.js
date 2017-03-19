module.exports = function(params, tooltip) {
  return `
    <div class="tooltip-wrapper">
      <div class="tip tip-up">
        <span class="title">
          ${params.title || ''}
        </span>
        <span class="close" id="__tooltip-${tooltip.myId}">
        </span>
      </div>
      <div class="text">
        ${params.text || ''}
      </div>
    </div>
  `;
};
