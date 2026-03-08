/**
 * Мок next/image для тестов.
 * Рендерит обычный <img> без оптимизации Next.js.
 */
const React = require("react");

function MockImage(props) {
  const { fill, priority, sizes, quality, placeholder, blurDataURL, loader, ...rest } = props;
  return React.createElement("img", rest);
}

MockImage.displayName = "MockNextImage";

module.exports = MockImage;
module.exports.default = MockImage;
