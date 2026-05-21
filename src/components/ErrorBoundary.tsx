// @ts-nocheck
import React, { ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "20px", background: "#fee2e2", color: "#991b1b", minHeight: "100vh" }}>
          <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "16px" }}>Đã xảy ra lỗi giao diện! (Tránh màn hình trắng)</h1>
          <p style={{ marginBottom: "8px" }}>Vui lòng chụp màn hình lỗi này gửi cho kỹ thuật:</p>
          <pre style={{ background: "#f87171", color: "white", padding: "16px", borderRadius: "8px", overflowX: "auto" }}>
            {this.state.error?.toString()}
          </pre>
          <details style={{ marginTop: "16px", cursor: "pointer" }}>
            <summary style={{ fontWeight: "bold" }}>Xem chi tiết lỗi (Click để mở)</summary>
            <pre style={{ background: "#fecaca", padding: "16px", borderRadius: "8px", marginTop: "8px", overflowX: "auto", fontSize: "12px" }}>
              {this.state.errorInfo?.componentStack}
            </pre>
          </details>
          <button 
            onClick={() => window.location.reload()} 
            style={{ marginTop: "20px", padding: "10px 20px", background: "#ef4444", color: "white", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", border: "none" }}>
            Tải lại trang
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
