-- 插入测试用户
INSERT INTO "User" (username, password, role, email) VALUES 
('admin', 'admin123', 'admin', 'admin@example.com'),
('teacher1', 'teacher123', 'teacher', 'teacher@example.com'),
('student1', 'student123', 'student', 'student1@example.com'),
('student2', 'student123', 'student', 'student2@example.com');

-- 插入测试词表
INSERT INTO WordList (list_name, description, creator_id, is_public, difficulty) VALUES 
('CET-4 核心词汇', '大学英语四级考试核心词汇表', 1, TRUE, 'CET-4'),
('CET-6 高频词汇', '大学英语六级考试高频词汇', 1, TRUE, 'CET-6'),
('GRE 核心词汇', 'GRE考试必备核心词汇', 1, TRUE, 'GRE');

-- 插入测试单词数据
-- ability
INSERT INTO Word (list_id, word) VALUES (1, 'ability');
INSERT INTO WordTranslation (word_id, translation, word_type) VALUES 
(1, '能力，能耐；才能', 'n'),
(1, '无能，无力', 'n'),
(1, '可能性，潜力', 'n'),
(1, '技能，技巧', 'n');
INSERT INTO WordPhrase (word_id, phrase, translation) VALUES 
(1, 'innovation ability', '创新能力'),
(1, 'ability for', '在…的能力'),
(1, 'learning ability', '学习能力'),
(1, 'practical ability', '实践能力；实际能力'),
(1, 'technical ability', '技术能力');

-- able
INSERT INTO Word (list_id, word) VALUES (1, 'able');
INSERT INTO WordTranslation (word_id, translation, word_type) VALUES 
(2, '能；[经管] 有能力的；能干的', 'adj'),
(2, '无能的，不能的', 'adj'),
(2, '可能的，有潜力的', 'adj'),
(2, '熟练的，精通的', 'adj');
INSERT INTO WordPhrase (word_id, phrase, translation) VALUES 
(2, 'will be able to', '将能够'),
(2, 'be able to do', '能够做'),
(2, 'be able to take', '经受得住某事'),
(2, 'able person', '能人；有能力的人'),
(2, 'spell able', '干练的；有能力的');

-- about
INSERT INTO Word (list_id, word) VALUES (1, 'about');
INSERT INTO WordTranslation (word_id, translation, word_type) VALUES 
(3, '关于；大约', 'prep'),
(3, '在附近的；四处走动的', 'adj'),
(3, '大约；周围；到处', 'adv'),
(3, '远离；不相关', 'prep');
INSERT INTO WordPhrase (word_id, phrase, translation) VALUES 
(3, 'how about', '你认为…怎样'),
(3, 'what about', '怎么样；（对于）…怎么样'),
(3, 'all about', '到处，各处；关于…的一切'),
(3, 'about us', '关于我们；公司简介'),
(3, 'do about', '处理；应付');

-- above
INSERT INTO Word (list_id, word) VALUES (1, 'above');
INSERT INTO WordTranslation (word_id, translation, word_type) VALUES 
(4, '在...上面；超过；在...之上', 'prep'),
(4, '在下面；低于', 'prep'),
(4, '在旁边；平行', 'prep'),
(4, '在内部；包含', 'prep');
INSERT INTO WordPhrase (word_id, phrase, translation) VALUES 
(4, 'above all', '首先；尤其是'),
(4, 'above average', '高于平均水平'),
(4, 'above board', '光明正大的；公开的'),
(4, 'above mentioned', '上述的；前面提到的'),
(4, 'above the law', '凌驾于法律之上');

-- abroad
INSERT INTO Word (list_id, word) VALUES (1, 'abroad');
INSERT INTO WordTranslation (word_id, translation, word_type) VALUES 
(5, '在国外；海外', 'adv'),
(5, '在国内；本地', 'adv'),
(5, '在边境；边界', 'adv'),
(5, '在远方；远处', 'adv');
INSERT INTO WordPhrase (word_id, phrase, translation) VALUES 
(5, 'go abroad', '出国'),
(5, 'study abroad', '留学'),
(5, 'live abroad', '在国外生活'),
(5, 'travel abroad', '出国旅行'),
(5, 'work abroad', '在国外工作');

-- absolute
INSERT INTO Word (list_id, word) VALUES (2, 'absolute');
INSERT INTO WordTranslation (word_id, translation, word_type) VALUES 
(6, '绝对的；完全的；纯粹的', 'adj'),
(6, '相对的；部分的', 'adj'),
(6, '有限的；有条件的', 'adj'),
(6, '暂时的；临时的', 'adj');
INSERT INTO WordPhrase (word_id, phrase, translation) VALUES 
(6, 'absolute power', '绝对权力'),
(6, 'absolute truth', '绝对真理'),
(6, 'absolute value', '绝对值'),
(6, 'absolute majority', '绝对多数'),
(6, 'absolute zero', '绝对零度');

-- absorb
INSERT INTO Word (list_id, word) VALUES (2, 'absorb');
INSERT INTO WordTranslation (word_id, translation, word_type) VALUES 
(7, '吸收；吸引；使全神贯注', 'v'),
(7, '释放；排出', 'v'),
(7, '排斥；拒绝', 'v'),
(7, '分散；分散注意力', 'v');
INSERT INTO WordPhrase (word_id, phrase, translation) VALUES 
(7, 'absorb knowledge', '吸收知识'),
(7, 'absorb water', '吸水'),
(7, 'absorb light', '吸收光线'),
(7, 'absorb heat', '吸收热量'),
(7, 'absorb information', '吸收信息');

-- abstract
INSERT INTO Word (list_id, word) VALUES (2, 'abstract');
INSERT INTO WordTranslation (word_id, translation, word_type) VALUES 
(8, '抽象的；理论的', 'adj'),
(8, '具体的；实际的', 'adj'),
(8, '简单的；基础的', 'adj'),
(8, '复杂的；深奥的', 'adj');
INSERT INTO WordPhrase (word_id, phrase, translation) VALUES 
(8, 'abstract concept', '抽象概念'),
(8, 'abstract art', '抽象艺术'),
(8, 'abstract thinking', '抽象思维'),
(8, 'abstract idea', '抽象想法'),
(8, 'abstract noun', '抽象名词');

-- abundant
INSERT INTO Word (list_id, word) VALUES (2, 'abundant');
INSERT INTO WordTranslation (word_id, translation, word_type) VALUES 
(9, '丰富的；充裕的；大量的', 'adj'),
(9, '缺乏的；不足的', 'adj'),
(9, '有限的；稀少的', 'adj'),
(9, '贫瘠的；荒芜的', 'adj');
INSERT INTO WordPhrase (word_id, phrase, translation) VALUES 
(9, 'abundant resources', '丰富的资源'),
(9, 'abundant evidence', '充足的证据'),
(9, 'abundant supply', '充足的供应'),
(9, 'abundant rainfall', '充足的降雨'),
(9, 'abundant opportunities', '大量的机会');

-- abuse
INSERT INTO Word (list_id, word) VALUES (2, 'abuse');
INSERT INTO WordTranslation (word_id, translation, word_type) VALUES 
(10, '滥用；虐待；辱骂', 'v'),
(10, '保护；维护', 'v'),
(10, '尊重；重视', 'v'),
(10, '支持；帮助', 'v');
INSERT INTO WordPhrase (word_id, phrase, translation) VALUES 
(10, 'drug abuse', '药物滥用'),
(10, 'child abuse', '虐待儿童'),
(10, 'alcohol abuse', '酗酒'),
(10, 'power abuse', '滥用权力'),
(10, 'verbal abuse', '言语辱骂');

-- academic
INSERT INTO Word (list_id, word) VALUES (3, 'academic');
INSERT INTO WordTranslation (word_id, translation, word_type) VALUES 
(11, '学术的；理论的；教学的', 'adj'),
(11, '实践的；实用的', 'adj'),
(11, '商业的；经济的', 'adj'),
(11, '艺术的；创意的', 'adj');
INSERT INTO WordPhrase (word_id, phrase, translation) VALUES 
(11, 'academic year', '学年'),
(11, 'academic research', '学术研究'),
(11, 'academic performance', '学业表现'),
(11, 'academic degree', '学位'),
(11, 'academic journal', '学术期刊');

-- accelerate
INSERT INTO Word (list_id, word) VALUES (3, 'accelerate');
INSERT INTO WordTranslation (word_id, translation, word_type) VALUES 
(12, '加速；促进；增加', 'v'),
(12, '减速；减缓', 'v'),
(12, '停止；终止', 'v'),
(12, '维持；保持', 'v');
INSERT INTO WordPhrase (word_id, phrase, translation) VALUES 
(12, 'accelerate growth', '加速增长'),
(12, 'accelerate development', '加速发展'),
(12, 'accelerate the process', '加速进程'),
(12, 'accelerate learning', '加速学习'),
(12, 'accelerate change', '加速变革');

-- accent
INSERT INTO Word (list_id, word) VALUES (3, 'accent');
INSERT INTO WordTranslation (word_id, translation, word_type) VALUES 
(13, '口音；重音；强调', 'n'),
(13, '沉默；安静', 'n'),
(13, '噪音；杂音', 'n'),
(13, '回声；回响', 'n');
INSERT INTO WordPhrase (word_id, phrase, translation) VALUES 
(13, 'foreign accent', '外国口音'),
(13, 'strong accent', '浓重的口音'),
(13, 'regional accent', '地方口音'),
(13, 'accent mark', '重音符号'),
(13, 'accent color', '强调色');

-- accept
INSERT INTO Word (list_id, word) VALUES (1, 'accept');
INSERT INTO WordTranslation (word_id, translation, word_type) VALUES 
(14, '接受；同意；承认', 'v'),
(14, '拒绝；否认', 'v'),
(14, '怀疑；质疑', 'v'),
(14, '忽略；忽视', 'v');
INSERT INTO WordPhrase (word_id, phrase, translation) VALUES 
(14, 'accept responsibility', '承担责任'),
(14, 'accept an offer', '接受提议'),
(14, 'accept a challenge', '接受挑战'),
(14, 'accept defeat', '接受失败'),
(14, 'accept reality', '接受现实');

-- access
INSERT INTO Word (list_id, word) VALUES (2, 'access');
INSERT INTO WordTranslation (word_id, translation, word_type) VALUES 
(15, '访问；进入；使用权', 'n'),
(15, '限制；禁止', 'n'),
(15, '退出；离开', 'n'),
(15, '拒绝；排斥', 'n');
INSERT INTO WordPhrase (word_id, phrase, translation) VALUES 
(15, 'access to', '进入；使用'),
(15, 'easy access', '容易获得'),
(15, 'public access', '公共访问'),
(15, 'access control', '访问控制'),
(15, 'access point', '接入点');

-- 插入一些学习记录
INSERT INTO StudyLog (user_id, word_id, status) VALUES 
(3, 1, 'known'),
(3, 2, 'unknown'),
(3, 3, 'learning'),
(4, 1, 'known'),
(4, 2, 'known');

-- 插入复习计划
INSERT INTO ReviewSchedule (user_id, word_id, review_date, repeat_count) VALUES (3, 2, CURRENT_TIMESTAMP + 1, 0);
INSERT INTO ReviewSchedule (user_id, word_id, review_date, repeat_count) VALUES (3, 3, CURRENT_TIMESTAMP + 3, 1);
INSERT INTO ReviewSchedule (user_id, word_id, review_date, repeat_count) VALUES (4, 1, CURRENT_TIMESTAMP + 7, 2);

-- 插入收藏词汇
INSERT INTO FavoriteWord (user_id, word_id) VALUES (3, 1);
INSERT INTO FavoriteWord (user_id, word_id) VALUES (3, 2);
INSERT INTO FavoriteWord (user_id, word_id) VALUES (4, 3);

-- 插入错词记录
INSERT INTO WrongWord (user_id, word_id, wrong_count, error_type, user_answer) VALUES 
(3, 2, 2, '含义理解', '不能'),
(4, 3, 1, '含义理解', '具体的');

-- 插入打卡记录
INSERT INTO CheckInLog (user_id, checkin_date, word_count, study_duration, accuracy_rate) VALUES 
(3, CURRENT_DATE, 25, 30, 85.5);

INSERT INTO CheckInLog (user_id, checkin_date, word_count, study_duration, accuracy_rate) VALUES 
(3, CURRENT_DATE - 1, 30, 35, 82.3);

INSERT INTO CheckInLog (user_id, checkin_date, word_count, study_duration, accuracy_rate) VALUES 
(4, CURRENT_DATE, 20, 25, 90.0); 