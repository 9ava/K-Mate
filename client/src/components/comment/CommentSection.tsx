// src/components/comment/CommentSection.tsx
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../features/auth/useAuth'
import { fetchCourseComments, createCourseComment, updateCourseComment, deleteCourseComment, type CommentItem } from '../../api/comments'

interface CommentSectionProps {
  courseId: string
  title?: string
  className?: string
}

export default function CommentSection({ courseId, title, className = "" }: CommentSectionProps) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [comments, setComments] = useState<CommentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editContent, setEditContent] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  // 댓글 목록 로드
  const loadComments = async (pageNum: number = 1) => {
    try {
      setLoading(true)
      const response = await fetchCourseComments(courseId, pageNum, 10)

      if (pageNum === 1) {
        setComments(response.items)
      } else {
        setComments(prev => [...prev, ...response.items])
      }

      setTotalPages(Math.ceil(response.total / response.limit))
      setTotalCount(response.total)
      setPage(pageNum)
    } catch (error) {
      console.error('Failed to load comments:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadComments()
  }, [courseId])

  // 새 댓글 작성
  const handleSubmitComment = async () => {
    if (!newComment.trim() || !user) return

    try {
      setSubmitting(true)
      const comment = await createCourseComment(courseId, newComment.trim())
      setComments(prev => [comment, ...prev])
      setTotalCount(prev => prev + 1)
      setNewComment('')
    } catch (error) {
      console.error('Failed to create comment:', error)
      alert(t('comments.create_failed', '댓글 작성에 실패했습니다.'))
    } finally {
      setSubmitting(false)
    }
  }

  // 댓글 수정
  const handleEditComment = async (commentId: number) => {
    if (!editContent.trim()) return

    try {
      const updatedComment = await updateCourseComment(commentId, editContent.trim())
      setComments(prev =>
        prev.map(comment =>
          comment.id === commentId ? updatedComment : comment
        )
      )
      setEditingId(null)
      setEditContent('')
    } catch (error) {
      console.error('Failed to update comment:', error)
      alert(t('comments.update_failed', '댓글 수정에 실패했습니다.'))
    }
  }

  // 댓글 삭제
  const handleDeleteComment = async (commentId: number) => {
    if (!confirm(t('comments.delete_confirm', '댓글을 삭제하시겠습니까?'))) return

    try {
      await deleteCourseComment(commentId)
      setComments(prev => prev.filter(comment => comment.id !== commentId))
      setTotalCount(prev => prev - 1)
    } catch (error) {
      console.error('Failed to delete comment:', error)
      alert(t('comments.delete_failed', '댓글 삭제에 실패했습니다.'))
    }
  }

  // 더 보기
  const handleLoadMore = () => {
    if (page < totalPages) {
      loadComments(page + 1)
    }
  }

  // 편집 시작
  const startEditing = (comment: CommentItem) => {
    setEditingId(comment.id)
    setEditContent(comment.content)
  }

  // 편집 취소
  const cancelEditing = () => {
    setEditingId(null)
    setEditContent('')
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {title || t('comments.title', '댓글')}({totalCount})
      </h3>

      {/* 댓글 작성 폼 */}
      {user ? (
        <div className="mb-6">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.name || 'User'}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 text-sm font-medium">
                    {(user.name || 'U').charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={t('comments.placeholder', '댓글을 입력하세요...')}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? t('comments.submitting', '작성 중...') : t('comments.submit', '댓글 작성')}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-gray-600">{t('comments.login_required', '댓글을 작성하려면 로그인이 필요합니다.')}</p>
        </div>
      )}

      {/* 댓글 목록 */}
      <div className="space-y-4">
        {loading && comments.length === 0 ? (
          <div className="py-8">
            <div className="text-gray-500">{t('comments.loading', '댓글을 불러오는 중...')}</div>
          </div>
        ) : comments.length === 0 ? (
          <div className="py-8">
            <div className="text-gray-500">{t('comments.empty', '아직 댓글이 없습니다.')}</div>
            <div className="text-sm text-gray-400 mt-1">{t('comments.empty_hint', '첫 번째 댓글을 작성해보세요!')}</div>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 p-4 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0">
                {comment.author.avatarUrl ? (
                  <img
                    src={comment.author.avatarUrl}
                    alt={comment.author.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 text-sm font-medium">
                      {comment.author.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="font-medium text-gray-900">{comment.author.name}</span>
                    <span className="text-gray-500 text-sm ml-2">
                      {new Date(comment.createdAt).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {/* 작성자만 수정/삭제 가능 */}
                  {user && user.id === comment.author.id && (
                    <div className="flex gap-2">
                      {editingId === comment.id ? (
                        <>
                          <button
                            onClick={() => handleEditComment(comment.id)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            {t('comments.save', '저장')}
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="text-gray-600 hover:text-gray-800 text-sm"
                          >
                            {t('comments.cancel', '취소')}
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEditing(comment)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            {t('comments.edit', '수정')}
                          </button>
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            {t('comments.delete', '삭제')}
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* 댓글 내용 */}
                {editingId === comment.id ? (
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-left"
                    rows={2}
                  />
                ) : (
                  <p className="text-gray-700 whitespace-pre-wrap text-left">{comment.content}</p>
                )}
              </div>
            </div>
          ))
        )}

        {/* 더 보기 버튼 */}
        {page < totalPages && (
          <div className="text-center">
            <button
              onClick={handleLoadMore}
              disabled={loading}
              className="px-4 py-2 text-blue-600 hover:text-blue-800 disabled:opacity-50"
            >
              {loading ? t('comments.loading', '로딩 중...') : t('comments.load_more', '댓글 더 보기')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}