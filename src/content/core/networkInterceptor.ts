export class NetworkInterceptor {
  private isRedirecting = false;
  private enabled = true; 
  private originalFetch = window.fetch;
  private originalXhrOpen = XMLHttpRequest.prototype.open;

  constructor(private extensionEnabled: () => boolean) {
    this.patchFetch();
    this.patchXhr();
  }

  public enable() {
    this.enabled = true;
  }

  public disable() {
    this.enabled = false;
  }

  private patchFetch() {
    window.fetch = async (...args) => {
      if (!this.enabled) return this.originalFetch(...args);

      console.log("[INFO] Fetch called with URL:", args[0]);

      if (this.isRedirecting) {
        console.log("[INFO] Redirect nội bộ, bỏ qua fetch.");
        return new Response();
      }

      const response = await this.originalFetch(...args);
      response.clone().text().then((text) => {
        if (text.includes("redirectInternalKeyword")) {
          this.isRedirecting = true;
        }
      });

      return response;
    };
  }

  private patchXhr() {
    const interceptor = this;

    XMLHttpRequest.prototype.open = (
      method: string,
      url: string | URL,
      async: boolean = true,
      username?: string | null,
      password?: string | null
    ) => {
      if (!interceptor.enabled) {
        return interceptor.originalXhrOpen.apply(this, [
          method,
          url,
          async,
          username,
          password,
        ]);
      }

      console.log("[INFO] XMLHttpRequest called with URL:", url);

      if (interceptor.isRedirecting) {
        console.log("[INFO] Redirect nội bộ, bỏ qua XMLHttpRequest.");
        return;
      }

      const xhr = this as any as XMLHttpRequest;
      xhr.addEventListener("load", function () {
        if (xhr.responseText.includes("redirectInternalKeyword")) {
          interceptor.isRedirecting = true;
        }
      });

      return this.originalXhrOpen.apply(xhr, [
        method,
        url,
        async,
        username,
        password,
      ]);
    };
  }
}
