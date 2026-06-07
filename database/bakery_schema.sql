CREATE DATABASE IF NOT EXISTS bakery_order_delivery DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE bakery_order_delivery;

CREATE TABLE IF NOT EXISTS products (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL COMMENT '商品名称',
    description TEXT COMMENT '商品描述',
    price DECIMAL(10, 2) NOT NULL COMMENT '价格',
    category VARCHAR(50) NOT NULL COMMENT '分类：cake-蛋糕, bread-面包, pastry-点心',
    daily_capacity INT NOT NULL DEFAULT 0 COMMENT '当日产能上限',
    is_customizable TINYINT(1) DEFAULT 0 COMMENT '是否可定制：0-否，1-是',
    lead_time_hours INT DEFAULT 0 COMMENT '提前下单时间（小时），定制蛋糕默认24',
    image_url VARCHAR(255) COMMENT '商品图片URL',
    status TINYINT(1) DEFAULT 1 COMMENT '状态：0-下架，1-上架',
    created_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品表';

CREATE TABLE IF NOT EXISTS customers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL COMMENT '客户姓名',
    phone VARCHAR(20) NOT NULL UNIQUE COMMENT '手机号',
    address TEXT COMMENT '默认配送地址',
    created_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='客户表';

CREATE TABLE IF NOT EXISTS orders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_no VARCHAR(32) NOT NULL UNIQUE COMMENT '订单号',
    customer_id BIGINT NOT NULL COMMENT '客户ID',
    total_amount DECIMAL(10, 2) NOT NULL COMMENT '订单总金额',
    delivery_type TINYINT(1) NOT NULL COMMENT '配送方式：0-自提，1-骑手配送',
    delivery_address TEXT COMMENT '配送地址（骑手配送时必填）',
    delivery_time DATETIME COMMENT '期望配送时间',
    rider_id BIGINT COMMENT '骑手ID',
    order_status TINYINT DEFAULT 0 COMMENT '订单状态：0-待确认，1-已确认，2-制作中，3-配送中，4-已完成，5-已取消',
    remark TEXT COMMENT '订单备注',
    created_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_customer_id (customer_id),
    INDEX idx_order_status (order_status),
    INDEX idx_rider_id (rider_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单表';

CREATE TABLE IF NOT EXISTS order_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL COMMENT '订单ID',
    product_id BIGINT NOT NULL COMMENT '商品ID',
    quantity INT NOT NULL DEFAULT 1 COMMENT '数量',
    unit_price DECIMAL(10, 2) NOT NULL COMMENT '单价',
    subtotal DECIMAL(10, 2) NOT NULL COMMENT '小计',
    custom_requirements TEXT COMMENT '定制要求（写字、加花等）',
    created_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_order_id (order_id),
    INDEX idx_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单明细表';

CREATE TABLE IF NOT EXISTS daily_inventory (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT NOT NULL COMMENT '商品ID',
    inventory_date DATE NOT NULL COMMENT '库存日期',
    total_capacity INT NOT NULL COMMENT '当日总产能',
    remaining_quantity INT NOT NULL COMMENT '剩余可售数量',
    created_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_product_date (product_id, inventory_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='当日库存表';

CREATE TABLE IF NOT EXISTS riders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL COMMENT '骑手姓名',
    phone VARCHAR(20) NOT NULL UNIQUE COMMENT '手机号',
    status TINYINT DEFAULT 1 COMMENT '状态：0-离线，1-在线，2-配送中',
    current_location VARCHAR(255) COMMENT '当前位置',
    created_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='骑手表';

CREATE TABLE IF NOT EXISTS delivery_tasks (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL COMMENT '订单ID',
    rider_id BIGINT NOT NULL COMMENT '骑手ID',
    task_status TINYINT DEFAULT 0 COMMENT '任务状态：0-待取货，1-配送中，2-已完成',
    delivery_sequence INT DEFAULT 1 COMMENT '配送顺序',
    estimated_arrival_time DATETIME COMMENT '预计送达时间',
    actual_arrival_time DATETIME COMMENT '实际送达时间',
    created_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_rider_id (rider_id),
    INDEX idx_task_status (task_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='配送任务表';

CREATE TABLE IF NOT EXISTS feedbacks (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL COMMENT '订单ID',
    customer_id BIGINT NOT NULL COMMENT '客户ID',
    product_id BIGINT NOT NULL COMMENT '商品ID',
    taste_rating INT COMMENT '口味评分：1-5星',
    satisfaction_rating INT COMMENT '满意度评分：1-5星',
    comment TEXT COMMENT '评价内容',
    feedback_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_order_id (order_id),
    INDEX idx_product_id (product_id),
    INDEX idx_customer_id (customer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='客户反馈表';

INSERT INTO products (name, description, price, category, daily_capacity, is_customizable, lead_time_hours, status) VALUES
('经典戚风蛋糕', '轻盈松软的经典戚风蛋糕，入口即化', 128.00, 'cake', 20, 1, 24, 1),
('巧克力慕斯蛋糕', '浓郁巧克力慕斯，口感丝滑', 158.00, 'cake', 15, 1, 24, 1),
('法式牛角包', '正宗法式牛角包，外酥里软', 12.00, 'bread', 50, 0, 0, 1),
('全麦吐司', '健康全麦吐司，营养美味', 18.00, 'bread', 30, 0, 0, 1),
('草莓奶油蛋糕', '新鲜草莓搭配香浓奶油', 168.00, 'cake', 10, 1, 24, 1),
('蛋黄酥', '传统中式点心，酥香可口', 8.00, 'pastry', 100, 0, 0, 1),
('芒果千层蛋糕', '层层芒果与奶油的完美结合', 138.00, 'cake', 12, 1, 24, 1),
('芝士面包', '香浓芝士，松软可口', 15.00, 'bread', 40, 0, 0, 1);

INSERT INTO riders (name, phone, status) VALUES
('张三', '13800138001', 1),
('李四', '13800138002', 1),
('王五', '13800138003', 0);

INSERT INTO customers (name, phone, address) VALUES
('王小姐', '13900139001', '北京市朝阳区建国路88号'),
('李先生', '13900139002', '北京市海淀区中关村大街1号');
