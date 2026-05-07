import { promises as fs } from "node:fs";
import path from "node:path";
import type { FileOps } from "../src/lib/file-ops";
import type { FsEntry } from "../src/lib/types";

function isEnoent(e: unknown): boolean {
  return !!e && typeof e === "object" && "code" in e
    && (e as { code?: string }).code === "ENOENT";
}

function safeJoin(root: string, parts: string[]): string {
  const full = path.resolve(root, ...parts);
  const rel = path.relative(root, full);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    throw new Error(`Path escapes root: ${parts.join("/")}`);
  }
  return full;
}

export interface NodeFileOps extends FileOps {
  readonly root: string;
}

export function createNodeFileOps(
  root: string,
  allowWrite = false,
): NodeFileOps {
  const assertWritable = () => {
    if (!allowWrite) throw new Error("Server is read-only");
  };

  const readText: FileOps["readText"] = async (...parts) => {
    try {
      return await fs.readFile(safeJoin(root, parts), "utf8");
    } catch (e) {
      if (isEnoent(e)) return null;
      throw e;
    }
  };

  return {
    root,

    readText,

    async readTextPartial(maxBytes, ...parts) {
      const fp = safeJoin(root, parts);
      let handle;
      try {
        handle = await fs.open(fp, "r");
      } catch (e) {
        if (isEnoent(e)) return null;
        throw e;
      }
      try {
        const buf = Buffer.alloc(maxBytes);
        const { bytesRead } = await handle.read(buf, 0, maxBytes, 0);
        return buf.subarray(0, bytesRead).toString("utf8");
      } finally {
        await handle.close();
      }
    },

    async readJson(...parts) {
      const text = await readText(...parts);
      if (text == null) return null;
      try {
        return JSON.parse(text);
      } catch {
        return null;
      }
    },

    async listDir(...parts): Promise<FsEntry[]> {
      try {
        const dirents = await fs.readdir(safeJoin(root, parts), {
          withFileTypes: true,
        });
        return dirents.map((d) => ({
          name: d.name,
          kind: d.isDirectory() ? "directory" : "file",
        }));
      } catch (e) {
        if (isEnoent(e)) return [];
        return [];
      }
    },

    async dirExists(...parts) {
      try {
        const st = await fs.stat(safeJoin(root, parts));
        return st.isDirectory();
      } catch {
        return false;
      }
    },

    async writeText(content, ...parts) {
      assertWritable();
      const fp = safeJoin(root, parts);
      await fs.mkdir(path.dirname(fp), { recursive: true });
      await fs.writeFile(fp, content, "utf8");
    },

    async removeFile(...parts) {
      assertWritable();
      await fs.rm(safeJoin(root, parts), { force: true });
    },

    async removeDir(recursive, ...parts) {
      assertWritable();
      await fs.rm(safeJoin(root, parts), {
        recursive,
        force: true,
      });
    },

    async checkWritePermission() {
      return allowWrite;
    },
  };
}
