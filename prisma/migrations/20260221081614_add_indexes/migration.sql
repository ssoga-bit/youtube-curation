-- CreateIndex
CREATE INDEX "feedbacks_video_id_idx" ON "feedbacks"("video_id");

-- CreateIndex
CREATE INDEX "user_progress_user_id_idx" ON "user_progress"("user_id");

-- CreateIndex
CREATE INDEX "videos_is_published_beginner_comfort_index_idx" ON "videos"("is_published", "beginner_comfort_index");

-- CreateIndex
CREATE INDEX "videos_is_published_published_at_idx" ON "videos"("is_published", "published_at");

-- CreateIndex
CREATE INDEX "videos_difficulty_idx" ON "videos"("difficulty");
