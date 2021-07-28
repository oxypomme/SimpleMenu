import { cx, css } from '@emotion/css';
import { SMOptions, SMContext, HTMLSMElement } from './types';
import { isSMContent, isSMContext, isSMHandler } from './types/guards';

export class SimpleMenu {
  /** The parent of the menu */
  private baseElement: HTMLElement;
  /** Various options */
  private options: SMOptions | undefined;
  /** Class name for menu & sub-menus */
  private className: string;

  /**
   * Init the menu
   *
   * @param el The parent of the menu
   * @param cm The menu
   * @param options Various options
   */
  constructor(el: HTMLElement, cm: SMContext, options?: SMOptions) {
    this.baseElement = el;
    this.options = options;

    /**
     * Priority order :
     *  1 - default CSS
     *  2 - custom classLists
     *  3 - custom CSS
     */
    let cxargs: string[] = [];
    if (this.options?.classList) {
      cxargs = [...cxargs, ...this.options.classList];
    }
    this.className = cx(
      css`
        display: none;
        list-style: none;
        padding: 0;
        margin: 0;
        width: fit-content;
        border: 1px solid black;
        border-radius: 3px;
        position: relative;
        background: white;
        text-align: left;

        & & {
          position: absolute;
          left: 100%;
          top: 0;
          display: none;

          &:hover {
            display: block;
          }
        }

        & > .sm_css-item {
          position: relative;
          padding: 5px;
          cursor: default;
          display: flex;

          & > .sm_css-prefix,
          & > .sm_css-suffix {
            flex: 1;
            align-self: center;
          }

          & > .sm_css-prefix {
            margin-right: 5px;
            text-align: start;
          }

          & > .sm_css-suffix {
            margin-left: 5px;
            text-align: end;
          }

          &:hover {
            background: #ddd;
          }

          &:first-child:hover {
            border-radius: 3px 3px 0 0;
          }
          &:last-child:hover {
            border-radius: 0 0 3px 3px;
          }
        }

        & > .sm_css-item:hover > & {
          display: block;
        }
      `,
      // Merging classLists with default CSS
      ...cxargs,
      // Merging custom CSS with default CSS
      css(this.options?.css) || ''
    );

    const container = document.createElement('div');
    const parentClassName = css`
      position: absolute;
    `;
    container.classList.add('sm_css-container', parentClassName);

    const menu = this.buildMenu(cm);

    // Adding the core event
    this.baseElement.addEventListener('contextmenu', ev => {
      ev.preventDefault();
      // Close all other menus
      document
        .querySelectorAll(`.${parentClassName} > .${this.className}`)
        .forEach(m => {
          (<HTMLElement>m).style.display = '';
        });

      menu.style.display = 'block';
      // Setting menu position
      if (menu.parentElement) {
        const baseRect = this.baseElement.getBoundingClientRect();
        const coords: { [type: string]: number } = {
          top: this.baseElement.offsetTop + baseRect.height / 2,
          left: this.baseElement.offsetLeft + baseRect.width / 4,
        };

        if (this.options?.keepInParent && this.baseElement.parentElement) {
          // Keep menu into baseElement's parent
          const parentEl = <any>this.baseElement.parentElement;
          for (const [offsetName, coordName, sizeName] of [['offsetWidth', 'left', 'width'], ['offsetHeight', 'top', 'height']]) {
            if(coords[coordName] < 0) {
              // Adding a small "margin" to be cleaner if there's a border
              coords[coordName] = 5;
            } else if ((coords[coordName] + (<any>baseRect)[sizeName]) > parentEl[offsetName]) {
              // Adding a small "margin" to be cleaner if there's a border
              coords[coordName] -= coords[coordName] + (<any>baseRect)[sizeName] - parentEl[offsetName] + 5;
            }
          }
        }

        for (const [coordName, coordValue] of Object.entries(coords)) {
          (<any>menu.parentElement.style)[coordName] =
            coordValue.toString() + 'px';
        }
      }

      this.checkChildsConditions(menu);
    });
    // If mouse leave, please close
    container.addEventListener('mouseleave', () => {
      menu.style.display = '';
    });

    container.appendChild(menu);
    this.baseElement.appendChild(container);
  }

  /**
   * Create the menu element
   *
   * @param cm The menu (or the sub-menu)
   * @returns The menu element
   */
  private buildMenu(cm: SMContext): HTMLElement {
    const menu = document.createElement('ul');

    /**
     * Close the whole menu
     */
    const closeMenu = () => (menu.style.display = '');
    if (this.options?.quitAfterClick) {
      menu.addEventListener('click', closeMenu);
    }

    for (const [label, content] of Object.entries(cm)) {
      const item = <HTMLSMElement>document.createElement('li');
      // In case you want to identify each entry
      item.setAttribute('name', `sm_${label.replace(' ', '-')}`);
      item.classList.add('sm_css-item');

      if (isSMContent(content)) {
        if (content.prefix) {
          if (content.prefix instanceof HTMLElement) {
            content.prefix.classList.add('sm_css-prefix');
            item.appendChild(content.prefix);
          } else {
            item.innerHTML += content.prefix;
          }
        }

        if (content.label) {
          if (content.label instanceof HTMLElement) {
            item.appendChild(content.label);
          } else {
            item.innerHTML += content.label;
          }
        } else {
          item.innerText += label;
        }

        if (content.suffix) {
          if (content.suffix instanceof HTMLElement) {
            content.suffix.classList.add('sm_css-suffix');
            item.appendChild(content.suffix);
          } else {
            item.innerHTML += content.suffix;
          }
        }

        if (content.action) {
          item.addEventListener('click', ev => {
            ev.stopPropagation();
            if (this.options?.quitAfterClick) {
              closeMenu();
            }
            //? Ask TS why I need to this tho
            if (content.action) {
              return content.action(ev, this.baseElement);
            }
          });
          item.style.cursor = 'pointer';
        }

        if(content.condition) {
          item.checkCondition = () => {
            //? Ask TS why I need to this tho
            if(content.condition && content.condition()) {
              item.style.display = '';
              return true;
            } else {
              item.style.display = 'none';
              return false;
            }
          }
        }

        if (content.sub) {
          if (!content.suffix && !this.options?.noPredefinedSuffix) {
            item.innerHTML += '<span class="sm_css-suffix">></span>';
          }
          item.appendChild(this.buildMenu(content.sub));
        }

        if (content.classList || content.css) {
          let cxargs: string[] = [];
          if (content.classList) {
            cxargs = [...cxargs, ...content.classList];
          }
          item.classList.add(
            cx(...cxargs, content.css ? css(content.css) : '')
          );
        }
      } else if (isSMContext(content)) {
        item.innerText += label;
        if (!this.options?.noPredefinedSuffix) {
          item.innerHTML += '<span class="sm_css-suffix">></span>';
        }
        item.appendChild(this.buildMenu(content));
      } else if (isSMHandler(content)) {
        item.innerText += label;
        item.addEventListener('click', ev => {
          ev.stopPropagation();
          if (this.options?.quitAfterClick) {
            closeMenu();
          }
          return content(ev, this.baseElement);
        });
        item.style.cursor = 'pointer';
      } else if (typeof content === 'string') {
        item.innerHTML += content;
      } else {
        item.innerText += label;
      }

      menu.classList.add('sm_css-menu', this.className);
      menu.appendChild(item);
    }

    return menu;
  }

  private checkChildsConditions(menu: HTMLElement): void {
    menu.querySelectorAll(':scope > .sm_css-item').forEach((itemElement) => {
      const item = <HTMLSMElement>itemElement;
      if(item.checkCondition && item.checkCondition()) {
        const submenu = <HTMLElement>item.querySelector(`:scope > .${this.className}`);
        if(submenu) {
          this.checkChildsConditions(submenu);
        }
      }
    });
  }
}
