import { cx, css } from '@emotion/css';

/**
 * Detailled entry in the menu
 */
interface SMContent {
  /** The label of the entry */
  label?: string | HTMLElement;
  /** Action triggered when user click on the entry */
  action?: SMHandler;
  /** Icon prefix of the entry */
  iconPrefix?: string | HTMLElement;
  /** Icon suffix of the entry */
  iconSuffix?: string | HTMLElement;
  /** Custom CSS as a `string` passed to the entry (through `emotion`) */
  css?: string;
  /** Custom CSS classes passed to the menu */
  classList?: string[];
  /** Sub-menu content */
  sub?: SMContext;
}

/**
 * Classic interface for menu and sub-menu
 */
interface SMContext {
  [item: string]: SMContent | SMContext | SMHandler | string;
}

interface SMOptions {
  /** If we need to close the menu after a click (default: `false`) */
  quitAfterClick?: boolean;
  /** Custom CSS as a `string` passed to the menu (through `emotion`) */
  css?: string;
  /** Custom CSS classes passed to the menu */
  classList?: string[];
}

/**
 * Action triggered when user click on the action
 *
 * @param ev The original event
 * @param origin The parent of the menu
 */
// eslint-disable-next-line no-unused-vars
type SMHandler = (ev: MouseEvent, origin: HTMLElement) => void;

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
          display: flex;

          & > :first-child:not(ul) {
            flex: 1;
            align-self: center;
            text-align: start;
            margin-right: 5px;
          }

          &:hover {
            background: #ddd;
          }

          &:hover > ul {
            display: block;
          }
        }
      `,
      // Merging classLists with default CSS
      this.options?.classList ? [...this.options.classList] : '',
      // Merging custom CSS with default CSS
      css(this.options?.css) || ''
    );

    const container = document.createElement('div');
    const parentClassName = css`
      position: absolute;
    `;
    container.classList.add(parentClassName);

    const menu = this.buildMenu(cm);

    // Adding the core event
    this.baseElement.addEventListener('contextmenu', ev => {
      ev.preventDefault();
      // Close all other menus
      document
        .querySelectorAll(`.${parentClassName} > .${this.className}`)
        .forEach(m => {
          (<HTMLElement>m).style.display = 'none';
        });

      menu.style.display = 'block';
      if (menu.parentElement) {
        // TODO : 1 element 4 all => Keep positions. Or find a way to ignore a relative parent
        const { width, height } = this.baseElement.getBoundingClientRect();
        menu.parentElement.style.top =
          (this.baseElement.offsetTop + height / 2).toString() + 'px';
        menu.parentElement.style.left =
          (this.baseElement.offsetLeft + width / 4).toString() + 'px';
      }
    });
    // If mouse leave, please close
    container.addEventListener('mouseleave', () => {
      menu.style.display = 'none';
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
    const closeMenu = () => (menu.style.display = 'none');
    if (this.options?.quitAfterClick) {
      menu.addEventListener('click', closeMenu);
    }

    for (const [label, content] of Object.entries(cm)) {
      const item = document.createElement('li');
      // In case you want to identify each entry
      item.setAttribute('name', `sm_${label.replace(' ', '-')}`);

      //! I DON'T LIKE TYPES GUARDS
      //TODO: Subjugate my fear of types guards and make some. Sigh.

      if (typeof content === 'object' && content.iconPrefix) {
        // If it's a detailled entry
        if (typeof content.iconPrefix === 'string') {
          item.innerHTML += content.iconPrefix;
        } else if (content.iconPrefix instanceof HTMLElement) {
          item.appendChild(content.iconPrefix);
        }
      }

      if (typeof content === 'string') {
        item.innerHTML = content;
      } else if (typeof content === 'object' && content.label) {
        // If it's a detailled entry
        if (typeof content.label === 'string') {
          item.innerHTML += content.label;
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
        // If it's a detailled entry
        item.addEventListener('click', ev => {
          ev.stopPropagation();
          if (this.options?.quitAfterClick) {
            closeMenu();
          }
          if (typeof content.action === 'function') {
            //? Ask TS why I need to this tho
            return content.action(ev, this.baseElement);
          }
        });
        item.style.cursor = 'pointer';
      }

      if (
        typeof content === 'object' &&
        // TODO: I really need a type guard
        (!(content.action || content.label) || content.sub)
      ) {
        // If it's a detailled entry or an entry
        let sub: SMContext;
        if (!content.sub) {
          // If it's an entry
          sub = content as SMContext;
        } else {
          // If it's a detailled entry
          sub = content.sub as SMContext;
        }

        const subMenu = this.buildMenu(sub);

        item.appendChild(subMenu);
      }

      if (typeof content === 'object' && content.iconPrefix) {
        // If it's a detailled entry
        if (typeof content.iconPrefix === 'string') {
          item.innerHTML += content.iconPrefix;
        } else if (content.iconPrefix instanceof HTMLElement) {
          item.appendChild(content.iconPrefix);
        }
      }

      item.classList.add(
        cx(
          typeof content === 'object' && Array.isArray(content.classList)
            ? [...content.classList]
            : '',
          typeof content === 'object' && typeof content.css === 'string'
            ? css(content.css)
            : ''
        )
      );

      menu.classList.add(this.className);
      menu.appendChild(item);
    }

    return menu;
  }
}
