<p align="center">
  <h1 align="center">Excel 工具</h1>
  <p align="center">一款微信小程序，支持文本解析、Excel 文件解析与数据导出</p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/WeChat-小程序-07C160?style=flat-square&logo=wechat" alt="WeChat MiniProgram" />
  <img src="https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=flat-square&logo=javascript&logoColor=black" alt="JavaScript" />
  <img src="https://img.shields.io/badge/基础库-3.15.2-blue?style=flat-square" alt="基础库" />
  <img src="https://img.shields.io/badge/API-REST-009688?style=flat-square" alt="REST API" />
  <img src="https://img.shields.io/badge/文件格式-xlsx%20%7C%20xls-FF6F00?style=flat-square" alt="Excel" />
</p>

---

## 功能特性

- **文本解析** — 粘贴任意分隔符文本（逗号、制表符、空格等），自动识别分隔符，一键导出为 `.xlsx`
- **Excel 解析** — 上传 `.xlsx` / `.xls` 文件，解析后预览数据，自动保存为任务
- **任务管理** — 查看历史解析任务，支持创建、删除
- **分组导出** — 按指定字段分组，拆分导出多个 Excel 文件
- **统计分析** — 对任务数据进行可视化统计
- **微信登录** — JWT 鉴权，数据云端保存

## 项目结构

```
├── pages/
│   ├── parse/
│   │   ├── text/          # 文本解析页面
│   │   └── excel/         # Excel 解析页面
│   ├── index/             # 任务列表（首页）
│   ├── task/
│   │   ├── create/        # 创建任务
│   │   └── detail/        # 任务详情
│   ├── stats/             # 统计分析
│   ├── profile/           # 个人中心
│   └── login/             # 登录
├── utils/
│   ├── api.js             # API 请求封装
│   └── util.js            # 通用工具函数
├── images/                # 图标资源
├── app.js                 # 小程序入口
└── app.json               # 全局配置
```

## 技术栈

| 技术 | 说明 |
|------|------|
| 微信小程序原生框架 | 前端 UI 与交互 |
| JavaScript (ES6+) | 开发语言 |
| wx.request / wx.uploadFile | 网络请求与文件上传 |
| wx.downloadFile / wx.openDocument | 文件下载与预览 |
| REST API | 后端接口通信 |
| JWT (Bearer Token) | 用户鉴权 |

## 快速开始

1. 克隆项目到本地
2. 使用 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html) 打开项目目录
3. 在 `project.config.json` 中填入自己的 AppID
4. 编译运行

## 许可证

MIT License
