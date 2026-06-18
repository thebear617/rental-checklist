# 租房对账表

一个纯静态网页项目，用于租房看房时的全流程检查清单，帮助从周边环境、硬装、软装到合同条款逐项核对。

## 项目结构

```text
.
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── checklist-data.js    # 结构化检查项数据
│   └── app.js               # 渲染、搜索与筛选逻辑
└── README.md
```

## 数据从哪里来

网页读取的数据文件是：

```text
js/checklist-data.js
```

这个文件定义 `checklistData`，每项检查包含：

```text
category       分类（周边与配套 / 硬装 / 软装 / 灰区 / 合同）
subcategory    子分类（如 墙面、地面、水电 等）
name           检查项名称
desc           检查要点与判断标准
```

`js/app.js` 负责读取 `checklistData`，渲染统计总览、搜索框、分类筛选和检查清单表格。

## 功能

- **搜索**：输入关键词即可过滤检查项，支持 200ms 防抖
- **分类筛选**：按 5 大类快速定位
- **统计面板**：实时显示各分类下的匹配项数
- **响应式**：适配桌面和移动端

## 事实源头

原始表单为独立 HTML 表格文件：

```text
/Users/mokaiche/Documents/house/租房对账表-V1.HTML
```

V2 版本已重构为结构化数据，存储在 `js/checklist-data.js` 中。后续修改检查项时，直接编辑该 JS 文件即可。

## 维护规则

- 新增检查项：在 `checklist-data.js` 对应分类的 `subcategories[].items[]` 中添加
- 修改检查内容：编辑对应项的 `name` 或 `desc` 字段
- 本地打开 `index.html` 检查页面是否正常
