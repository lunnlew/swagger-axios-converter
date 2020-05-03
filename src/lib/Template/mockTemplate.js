var mockTemplate = function (mocks) {
  return `
  import Mock from 'mockjs2'
  ${mocks.map(m => mockItemTemplate(m)).join('')}
  `;
}
exports.mockTemplate = mockTemplate

var mockItemTemplate = function (mocks) {
  return `
  Mock.mock(/${mocks.path.replace(/\//g,'\\/')}/, '${mocks.method}', Mock.mock(${mocks.mockRule}))
  `;
}
exports.mockItemTemplate = mockItemTemplate
