// npj 引导程序：双击 npj.exe 或用"打开方式"把文件交给 npj 时，
// 把收到的文件参数原样转发给 Electron。
// 编译（Dev-C++ 自带 TDM-GCC 4.9.2，最高 C++14）：
//   g++ -std=c++14 -O2 -mwindows -o npj.exe launcher.cpp -lshell32
#include <windows.h>
#include <shellapi.h>
#include <string>

static std::wstring exeDir() {
    wchar_t buf[MAX_PATH];
    DWORD n = GetModuleFileNameW(nullptr, buf, MAX_PATH);
    std::wstring s(buf, n);
    size_t p = s.find_last_of(L'\\');
    return (p == std::wstring::npos) ? L"." : s.substr(0, p);
}

int WINAPI WinMain(HINSTANCE, HINSTANCE, LPSTR, int) {
    std::wstring dir = exeDir();
    std::wstring electron = dir + L"\\node_modules\\electron\\dist\\electron.exe";

    // 收集传给 npj.exe 的参数（"打开方式"传来的文件路径），加引号原样转发
    std::wstring args;
    int argc = 0;
    LPWSTR* argv = CommandLineToArgvW(GetCommandLineW(), &argc);
    if (argv) {
        for (int i = 1; i < argc; ++i) {
            args += L" \"";
            args += argv[i];
            args += L"\"";
        }
        LocalFree(argv);
    }

    std::wstring cmd = L"\"" + electron + L"\" \"" + dir + L"\"" + args;

    STARTUPINFOW si;
    PROCESS_INFORMATION pi;
    ZeroMemory(&si, sizeof(si));
    ZeroMemory(&pi, sizeof(pi));
    si.cb = sizeof(si);

    if (!CreateProcessW(electron.c_str(), &cmd[0], nullptr, nullptr, FALSE,
                        CREATE_NO_WINDOW, nullptr, dir.c_str(), &si, &pi)) {
        MessageBoxW(nullptr,
            L"未能启动 npj。\n\n"
            L"找不到 node_modules\\electron\\dist\\electron.exe\n"
            L"请先运行 build.cmd 安装依赖。",
            L"npj", MB_OK | MB_ICONERROR);
        return 1;
    }
    CloseHandle(pi.hThread);
    CloseHandle(pi.hProcess);
    return 0;
}
