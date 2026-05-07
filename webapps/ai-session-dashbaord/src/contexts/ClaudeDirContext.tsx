import {
  createContext,
  useRef,
  useState,
  useCallback,
  useMemo,
  useEffect,
  type ReactNode,
} from "react";
import { saveHandle, loadHandle, clearHandle } from "../lib/idb";
import { fsDirExists } from "../lib/fs-access";
import type { DataSource, DataSourceMode } from "../data/source";
import { detectServerMode } from "../data/source";
import { createFsAccessSource } from "../data/source-fsaccess";
import { createHttpSource } from "../data/source-http";
import type { SessionKind } from "../lib/types";

declare global {
  interface Window {
    showDirectoryPicker(options?: {
      mode?: string;
      id?: string;
      startIn?: string;
    }): Promise<FileSystemDirectoryHandle>;
  }
}

interface ServerCapsResponse {
  serverMode?: boolean;
}

interface ClaudeDirContextValue {
  mode: DataSourceMode;
  kind: SessionKind | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  refreshCounter: number;
  selectKind: (kind: SessionKind) => Promise<void>;
  connect: (kind: SessionKind) => Promise<void>;
  disconnect: () => Promise<void>;
  refresh: () => void;
  getSource: () => DataSource;
}

const ClaudeDirContext = createContext<ClaudeDirContextValue | null>(null);

export function ClaudeDirProvider({ children }: { children: ReactNode }) {
  const injectedServerMode = useMemo(() => detectServerMode(), []);
  const [modeState, setModeState] = useState<DataSourceMode | "detecting">(
    injectedServerMode ? "server" : "detecting",
  );
  const isServerMode = modeState === "server";

  const dirRefs = useRef<Record<SessionKind, FileSystemDirectoryHandle | null>>({
    claude: null,
    codex: null,
  });
  const fsaSourceRefs = useRef<Partial<Record<SessionKind, DataSource>>>({});
  const httpSourceRefs = useRef<Partial<Record<SessionKind, DataSource>>>({});

  const [kind, setKind] = useState<SessionKind | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshCounter, setRefreshCounter] = useState(0);

  useEffect(() => {
    if (injectedServerMode) return;

    const controller = new AbortController();

    async function detectApiServer() {
      try {
        const resp = await fetch("/api/caps", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!resp.ok) {
          setModeState("static");
          return;
        }
        const caps = await resp.json() as ServerCapsResponse;
        setModeState(caps.serverMode === true ? "server" : "static");
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        setModeState("static");
      }
    }

    void detectApiServer();

    return () => controller.abort();
  }, [injectedServerMode]);

  for (const sourceKind of ["claude", "codex"] as const) {
    if (isServerMode && !httpSourceRefs.current[sourceKind]) {
      httpSourceRefs.current[sourceKind] = createHttpSource(sourceKind);
    }
    if (!isServerMode && !fsaSourceRefs.current[sourceKind]) {
      fsaSourceRefs.current[sourceKind] = createFsAccessSource(
        sourceKind,
        () => dirRefs.current[sourceKind],
      );
    }
  }

  const connect = useCallback(async (nextKind: SessionKind) => {
    setError(null);
    setIsLoading(true);
    try {
      if (isServerMode) {
        setKind(nextKind);
        setIsConnected(true);
        setRefreshCounter((c) => c + 1);
        return;
      }

      const saved = await loadHandle(nextKind);
      if (saved) {
        const perm = await saved.requestPermission({ mode: "readwrite" });
        if (perm === "granted") {
          dirRefs.current[nextKind] = saved;
          setKind(nextKind);
          setIsConnected(true);
          setRefreshCounter((c) => c + 1);
          return;
        }
      }

      const handle = await window.showDirectoryPicker({
        mode: "readwrite",
        id: `${nextKind}-dashboard-dir`,
        startIn: "desktop",
      });
      const isValid =
        nextKind === "claude"
          ? await fsDirExists(handle, "projects")
          : await fsDirExists(handle, "sessions");
      if (!isValid) {
        setError(
          `This does not look like a ~/.${nextKind} directory. Please select the .${nextKind} folder.`,
        );
        return;
      }
      dirRefs.current[nextKind] = handle;
      await saveHandle(nextKind, handle);
      setKind(nextKind);
      setIsConnected(true);
      setRefreshCounter((c) => c + 1);
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") {
        setError("Failed to connect: " + err.message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [isServerMode]);

  const selectKind = useCallback((nextKind: SessionKind) => connect(nextKind), [connect]);

  const disconnect = useCallback(async () => {
    if (kind && !isServerMode) {
      dirRefs.current[kind] = null;
      await clearHandle(kind);
    }
    setKind(null);
    setIsConnected(false);
  }, [isServerMode, kind]);

  const refresh = useCallback(() => {
    setRefreshCounter((c) => c + 1);
  }, []);

  const getSource = useCallback((): DataSource => {
    if (!kind) throw new Error("Session source is not selected");
    const source = isServerMode
      ? httpSourceRefs.current[kind]
      : fsaSourceRefs.current[kind];
    if (!source) throw new Error("Data source not initialized");
    return source;
  }, [isServerMode, kind]);

  return (
    <ClaudeDirContext.Provider
      value={{
        mode: isServerMode ? "server" : "static",
        kind,
        isConnected,
        isLoading: isLoading || modeState === "detecting",
        error,
        refreshCounter,
        selectKind,
        connect,
        disconnect,
        refresh,
        getSource,
      }}
    >
      {children}
    </ClaudeDirContext.Provider>
  );
}

export { ClaudeDirContext };
