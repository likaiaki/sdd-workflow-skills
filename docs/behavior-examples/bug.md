# 租户 0 订单隔离修复结果

依据：[issue.md](../../tests/behavior/fixtures/bug/issue.md) 明确租户 0 合法、列表仅返回所属租户，且本次已决定从实施阶段修复。本工程无 Git 或额外登记，沿用短记录；不因涉及租户权限重新索要既有授权。

根因与范围：真实入口 `api.get_orders` 把 header 转为整数，`service.orders` 拒绝 None，`repo.list_for_tenant` 却用真假判断过滤条件；0 因此进入返回全部订单的分支。已检查本工程全部使用方，仅有该调用链。

修改：[repo.py](../../tests/behavior/fixtures/bug/repo.py) 将 `if tenant_id:` 改为 `if tenant_id is not None:`，让合法 0 执行过滤，保留原接口、header 转换、服务拒绝语义及仓库 None 分支。新增 [test/test_orders_regression.py](../../tests/behavior/fixtures/bug/test/test_orders_regression.py) 和测试发现所需的 test/__init__.py；原有 test_orders.py 不变。没有无关重构。

验证（本机 Python 3.9.6，无 mock／fake，无外部服务）：

| 运行 ID（UTC） | 命令 | 实际结果 |
|---|---|---|
| 20261110T075343.663984Z | `PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -v` | 修复前 5 个测试中 1 个失败：真实入口请求租户 0 返回 a、b，独立预期仅 a |
| 20261110T075418.538349Z | 同上，另以 ast.parse 检查全部 6 个 Python 文件 | 修复后 5/5 通过；语法通过 |

5 个测试覆盖：租户 0 仅得 a 且输入行未改写、既有租户 1 仅得 b、租户 2 得空列表、服务收到 None 保持 ValueError("tenant required")、非法 header 保持 ValueError。预期来自 issue 和现有拒绝契约，未由修复逻辑计算；运行真实入口／转换／服务校验／仓库过滤，是进程内隔离功能验证与边界单元验证，不是 HTTP 或真实部署 E2E。

代码对应（SHA-256；以下为通过运行的全部 Python 文件）：

- api.py：`2087e4d8a359b942e411b0a23e991305e3feb4afb0a3708957e179b12d8d9a5e`
- repo.py：`a5c8d89be09089147e096e8952a8d447cb16a3325418eda3e255c39bba24d89d`
- service.py：`02051c9ff266e35a3410282ee34674b8dc96884551269f8295e867d58d86a79a`
- test/__init__.py：`01ba4719c80b6fe911b091a7c05124b64eeece964e09c058ef8f9805daca546b`
- test/test_orders_regression.py：`d5a6f5b38d5c90ca92618629409a4c3e77cb8a9817f0d262b2a3b4cfe1d31d2a`
- test_orders.py：`cd5a541f6394d98f4daee7301dab37cc7b5545deea23d256b7db4e168e4f42d7`

repo.py 修复前：`0de1ac48d2c8dc59b9563ebca4e937ea33795e49b31f8103f9855cb6be7aafaa`。回归测试在失败和通过运行间未改动。

自查：过滤仅读取内存行列表，无持久化、消息、外部资源、异步超时或部分成功状态。工程没有 lint／类型／构建入口，未运行这些检查。未验证实际部署鉴权与真实存储隔离；本工程未提供这些组件，不据此推断产品验收结论。

状态：实现就绪，待代码审核及测试岗位独立验收；本次无独立审核／验收通过结论。未运行 UI／真实环境 E2E，未提交、建分支、安装服务或外部写入。无阻塞实施的未决项。
