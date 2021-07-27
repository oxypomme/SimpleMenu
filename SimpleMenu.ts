import { cx, css } from '@emotion/css';

interface SMContent {
  label?: string | HTMLElement;
  action?: SMHandler;
  sub?: SMContext;
}

interface SMContext {
  [item: string]: SMContent | SMContext | SMHandler | string;
}

interface SMOptions {
  quitAfterClick?: boolean;
  css?: string;
  classList?: string[];
  fontAwesomePrefix?: string;
}

/**
 * @param ev The original event
 * @param origin The base element
 */
// eslint-disable-next-line no-unused-vars
type SMHandler = (ev: MouseEvent, origin: HTMLElement) => void;

export class SimpleMenu {
  baseElement: HTMLElement;
  options: SMOptions | undefined;

  constructor(el: HTMLElement, cm: SMContext, options?: SMOptions) {
    this.baseElement = el;
    this.options = options;

    const menu = this.buildMenu(cm);

    this.baseElement.addEventListener('contextmenu', ev => {
      ev.preventDefault();
      menu.style.display = 'block';
    });
    menu.addEventListener('mouseleave', function() {
      this.style.display = 'none';
    });

    this.baseElement.appendChild(menu);
  }

  private buildMenu(cm: SMContext): HTMLElement {
    const menu = document.createElement('ul');

    const closeMenu = () => (menu.style.display = 'none');
    if (this.options?.quitAfterClick) {
      menu.addEventListener('click', closeMenu);
    }

    for (const [label, content] of Object.entries(cm)) {
      const item = document.createElement('li');
      item.setAttribute('name', `sm_${label.replace(' ', '-')}`);

      if (typeof content === 'string') {
        item.innerHTML = content;
      } else if (typeof content === 'object' && content.label) {
        if (typeof content.label === 'string') {
          item.innerHTML = content.label;
        } else if (content.label instanceof HTMLElement) {
          item.appendChild(content.label);
        }
      } else {
        item.innerText = label;
      }

      if (typeof content === 'function') {
        item.addEventListener('click', ev => {
          ev.stopPropagation();
          if (this.options?.quitAfterClick) {
            closeMenu();
          }
          return content(ev, this.baseElement);
        });
        item.style.cursor = 'pointer';
      } else if (
        typeof content === 'object' &&
        typeof content.action === 'function'
      ) {
        item.addEventListener('click', ev => {
          ev.stopPropagation();
          if (this.options?.quitAfterClick) {
            closeMenu();
          }
          if (typeof content.action === 'function') {
            return content.action(ev, this.baseElement);
          }
        });
        item.style.cursor = 'pointer';
      }

      if (
        typeof content === 'object' &&
        (!(content.action || content.label) || content.sub)
      ) {
        let sub: SMContext;
        if (!content.sub) {
          sub = content as SMContext;
        } else {
          sub = content.sub as SMContext;
        }

        const subMenu = this.buildMenu(sub);
        const icon = document.createElement('i');
        if (this.options?.fontAwesomePrefix) {
          icon.classList.add(this.options.fontAwesomePrefix);
        }
        item.classList.add(css`
              padding-right: 20px !important;
    
              & > i {
                  position: absolute;
                  right: 5px;
              }
    
              & > i:before {
                  content: '${
                    this.options?.fontAwesomePrefix ? '\\f054' : '>'
                  }';
              }
          `);
        item.appendChild(icon);
        item.appendChild(subMenu);
      }
      menu.appendChild(item);
    }

    menu.classList.add(
      cx(
        css`
          display: none;
          list-style: none;
          padding: 0;
          margin: 0;
          width: fit-content;
          border: 1px solid black;
          border-radius: 3px;
          position: relative;

          & & {
            position: absolute;
            left: 100%;
            top: 0;
            display: none;

            &:hover {
              display: block;
            }
          }

          & > li {
            position: relative;
            padding: 5px;
            cursor: default;

            &:hover {
              background: #ddd;
            }

            &:hover > ul {
              display: block;
            }
          }
        `,
        this.options?.classList ? [...this.options.classList] : '',
        css(this.options?.css) || ''
      )
    );

    return menu;
  }
}
