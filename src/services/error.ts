interface ErrorInfo {
  message: string;
  stack: string | undefined;
  componentStack: string | undefined;
  timestamp: number;
  url: string;
  userAgent: string;
}

class ErrorService {
  private errors: ErrorInfo[] = [];
  private maxErrors = 50;

  reportError(error: Error, componentStack?: string) {
    const errorInfo: ErrorInfo = {
      message: error.message,
      stack: error.stack,
      componentStack: componentStack,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    // 添加到本地存储
    this.errors.push(errorInfo);
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }
    this.saveErrors();

    // 输出到控制台
    console.error('Application Error:', errorInfo);

    // TODO: 在这里添加错误上报到服务器的逻辑
  }

  private saveErrors() {
    try {
      localStorage.setItem('elastic-eye-errors', JSON.stringify(this.errors));
    } catch (e) {
      console.error('Failed to save errors to localStorage:', e);
    }
  }

  loadErrors(): ErrorInfo[] {
    try {
      const saved = localStorage.getItem('elastic-eye-errors');
      if (saved) {
        this.errors = JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load errors from localStorage:', e);
    }
    return this.errors;
  }

  clearErrors() {
    this.errors = [];
    try {
      localStorage.removeItem('elastic-eye-errors');
    } catch (e) {
      console.error('Failed to clear errors from localStorage:', e);
    }
  }
}

export const errorService = new ErrorService(); 