import type { Configuration } from '../../shared/types/config';

export interface UIHandlers {
  onSearch: (query: string) => void;
  onNavigate: () => void;
  onSetThreshold: () => void;
  onClear: () => void;
}

export class SearchBarUI {
  public container: HTMLElement;
  public input: HTMLInputElement;
  public label: HTMLElement;

  constructor(
    private config: Configuration,
    handlers: UIHandlers
  ) {
    this.container = document.createElement('div');
    this.container.className = `${config.cssPrefix}-search-bar`;

    this.input = document.createElement('input');
    this.input.type = 'text';
    this.input.className = `${config.cssPrefix}-search-input`;
    this.input.placeholder = 'Fuzzy search...';

    const searchButton = document.createElement('button');
    searchButton.className = `${config.cssPrefix}-search-btn`;
    searchButton.textContent = 'Search';

    const thresholdButton = document.createElement('button');
    thresholdButton.className = `${config.cssPrefix}-set-thresh-btn`;
    thresholdButton.textContent = 'Threshold';

    this.label = document.createElement('span');
    this.label.className = `${config.cssPrefix}-threshold-label`;

    this.input.addEventListener('input', (e) => {
      handlers.onSearch((e.target as HTMLInputElement).value);
    });

    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        handlers.onNavigate();
      } else if (e.key === 'Escape') {
        this.input.value = '';
        handlers.onClear();
        this.input.blur();
      }
    });

    searchButton.addEventListener('click', () => handlers.onNavigate());
    thresholdButton.addEventListener('click', () => handlers.onSetThreshold());

    this.container.append(
      this.input,
      searchButton,
      thresholdButton,
      this.label
    );
  }

  public mount() {
    document.body.prepend(this.container);
    setTimeout(() => this.input.focus(), 100);
  }

  public unmount() {
    this.container.remove();
  }

  public updateDisplay(threshold: number, currentIndex: number, total: number) {
    const displayText =
      total > 0
        ? `${threshold.toFixed(2)} (${currentIndex + 1}/${total})`
        : `${threshold.toFixed(2)} (—)`;
    this.label.textContent = displayText;
    this.label.classList.toggle(
      `${this.config.cssPrefix}-no-matches`,
      total === 0
    );
  }
}

export function injectStyles(config: Configuration) {
  const CLASSES = {
    searchBar: `${config.cssPrefix}-search-bar`,
    input: `${config.cssPrefix}-search-input`,
    button: `${config.cssPrefix}-search-btn`,
    thresholdButton: `${config.cssPrefix}-set-thresh-btn`,
    label: `${config.cssPrefix}-threshold-label`,
    highlight: `${config.cssPrefix}-highlight`,
    currentHighlight: `${config.cssPrefix}-current-highlight`,
    noMatches: `${config.cssPrefix}-no-matches`,
  };

  const style = document.createElement('style');
  style.textContent = `
    .${CLASSES.searchBar} {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
      background: #2d1b4e !important;
      border-bottom: 2px solid #7c3aed !important;
      z-index: 9999 !important;
      padding: 10px !important;
      box-sizing: border-box !important;
      display: flex !important;
      flex-wrap: wrap !important;
      gap: 10px !important;
      align-items: center !important;
      font-family: 'Victor Mono', monospace, sans-serif !important;
    }

    .${CLASSES.input} {
      flex: 1 1 200px !important;
      min-width: 200px !important;
      padding: 8px 12px !important;
      background: #1e1333 !important;
      border: 1px solid #6d28d9 !important;
      border-radius: 4px !important;
      color: #e9d5ff !important;
      font-size: 14px !important;
      outline: none !important;
      font-family: 'Victor Mono', monospace, sans-serif !important;
    }

    .${CLASSES.button}, .${CLASSES.thresholdButton} {
      padding: 8px 16px !important;
      background: #7c3aed !important;
      border: none !important;
      border-radius: 4px !important;
      color: #f3e8ff !important;
      font-weight: 600 !important;
      cursor: pointer !important;
      font-size: 14px !important;
      height: 36px !important;
    }

    .${CLASSES.thresholdButton} { background: #6d28d9 !important; }

    .${CLASSES.highlight} {
      background-color: rgba(168, 85, 247, 0.3) !important;
      outline: 2px solid #d946ef !important;
    }

    .${CLASSES.currentHighlight} {
      background-color: rgba(168, 85, 247, 0.5) !important;
      outline: 3px solid #ec4899 !important;
      box-shadow: 0 0 10px rgba(236, 72, 153, 0.5) !important;
    }

    .${CLASSES.noMatches} { color: #fbbf24 !important; }
  `;
  document.head.appendChild(style);
}
