export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-editorial-${cols.length}-cols`);

  // Mark the column that holds the image (it may also contain a caption).
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      if (col.querySelector('picture')) {
        col.classList.add('columns-editorial-img-col');
      } else {
        col.classList.add('columns-editorial-text-col');
      }
    });
  });
}
