-- =========================================================
-- K-Mate 데이터베이스 트리거 생성
-- 정책 강제를 위한 트리거들
-- =========================================================

-- 호환성 옵션
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

-- =========================================================
-- 트리거: 정책 강제
-- =========================================================
DELIMITER //

-- A. posts: tips/trend는 '작성자'가 admin이어야 생성/수정 가능
DROP TRIGGER IF EXISTS trg_posts_before_insert//
CREATE TRIGGER trg_posts_before_insert
BEFORE INSERT ON posts
FOR EACH ROW
BEGIN
  IF NEW.post_type IN ('tips','trend') THEN
    IF NOT EXISTS (SELECT 1 FROM users WHERE id = NEW.author_id AND role = 'admin') THEN
      SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Only admin can CREATE tips/trend posts';
    END IF;
  END IF;
END//

DROP TRIGGER IF EXISTS trg_posts_before_update//
CREATE TRIGGER trg_posts_before_update
BEFORE UPDATE ON posts
FOR EACH ROW
BEGIN
  IF NEW.post_type IN ('tips','trend') THEN
    IF NOT EXISTS (SELECT 1 FROM users WHERE id = NEW.author_id AND role = 'admin') THEN
      SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Only admin can UPDATE tips/trend posts';
    END IF;
  END IF;
END//

-- B. comments: community,trend에만 댓글 허용 (tips는 금지)
DROP TRIGGER IF EXISTS trg_comments_before_insert//
CREATE TRIGGER trg_comments_before_insert
BEFORE INSERT ON comments
FOR EACH ROW
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM posts
     WHERE id = NEW.post_id
       AND post_type IN ('community','trend')
  ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Comments are allowed only on community/trend posts';
  END IF;
END//

-- C. interactions: 정책 조합 제약
--    bookmark → place만
--    like/scrap → post만 + post_type in ('community','trend')
DROP TRIGGER IF EXISTS trg_interactions_before_insert//
CREATE TRIGGER trg_interactions_before_insert
BEFORE INSERT ON interactions
FOR EACH ROW
BEGIN
  -- bookmark는 place 전용
  IF NEW.interaction_type = 'bookmark' THEN
    IF NEW.target_type <> 'place' THEN
      SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Bookmark is only allowed for places';
    END IF;
    -- 존재 체크
    IF NOT EXISTS (SELECT 1 FROM places WHERE id = NEW.target_id) THEN
      SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Bookmark target place does not exist';
    END IF;
  ELSE
    -- like/scrap은 post 전용
    IF NEW.target_type <> 'post' THEN
      SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Like/Scrap are only allowed for posts';
    END IF;

    -- 대상 포스트가 community 또는 trend여야 함
    IF NOT EXISTS (
      SELECT 1 FROM posts
       WHERE id = NEW.target_id
         AND post_type IN ('community','trend')
    ) THEN
      SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Like/Scrap are allowed only on community/trend posts';
    END IF;
  END IF;
END//

-- (선택) UPDATE에도 동일 제약 적용
DROP TRIGGER IF EXISTS trg_interactions_before_update//
CREATE TRIGGER trg_interactions_before_update
BEFORE UPDATE ON interactions
FOR EACH ROW
BEGIN
  -- bookmark는 place 전용
  IF NEW.interaction_type = 'bookmark' THEN
    IF NEW.target_type <> 'place' THEN
      SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Bookmark is only allowed for places';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM places WHERE id = NEW.target_id) THEN
      SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Bookmark target place does not exist';
    END IF;
  ELSE
    IF NEW.target_type <> 'post' THEN
      SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Like/Scrap are only allowed for posts';
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM posts
       WHERE id = NEW.target_id
         AND post_type IN ('community','trend')
    ) THEN
      SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Like/Scrap are allowed only on community/trend posts';
    END IF;
  END IF;
END//

DELIMITER ;
