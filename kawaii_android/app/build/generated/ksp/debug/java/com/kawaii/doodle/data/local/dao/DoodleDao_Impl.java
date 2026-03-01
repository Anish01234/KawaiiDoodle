package com.kawaii.doodle.data.local.dao;

import android.database.Cursor;
import android.os.CancellationSignal;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.lifecycle.LiveData;
import androidx.room.CoroutinesRoom;
import androidx.room.EntityInsertionAdapter;
import androidx.room.RoomDatabase;
import androidx.room.RoomSQLiteQuery;
import androidx.room.SharedSQLiteStatement;
import androidx.room.util.CursorUtil;
import androidx.room.util.DBUtil;
import androidx.sqlite.db.SupportSQLiteStatement;
import com.kawaii.doodle.data.local.entity.DoodleEntity;
import java.lang.Class;
import java.lang.Exception;
import java.lang.Integer;
import java.lang.Long;
import java.lang.Object;
import java.lang.Override;
import java.lang.String;
import java.lang.SuppressWarnings;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.Callable;
import javax.annotation.processing.Generated;
import kotlin.coroutines.Continuation;

@Generated("androidx.room.RoomProcessor")
@SuppressWarnings({"unchecked", "deprecation"})
public final class DoodleDao_Impl implements DoodleDao {
  private final RoomDatabase __db;

  private final EntityInsertionAdapter<DoodleEntity> __insertionAdapterOfDoodleEntity;

  private final SharedSQLiteStatement __preparedStmtOfMarkAllRead;

  private final SharedSQLiteStatement __preparedStmtOfMarkWallpaperSet;

  public DoodleDao_Impl(@NonNull final RoomDatabase __db) {
    this.__db = __db;
    this.__insertionAdapterOfDoodleEntity = new EntityInsertionAdapter<DoodleEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "INSERT OR REPLACE INTO `doodles` (`id`,`senderId`,`receiverId`,`imageData`,`isRead`,`createdAt`,`wallpaperSetAt`) VALUES (?,?,?,?,?,?,?)";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final DoodleEntity entity) {
        statement.bindString(1, entity.getId());
        statement.bindString(2, entity.getSenderId());
        statement.bindString(3, entity.getReceiverId());
        statement.bindString(4, entity.getImageData());
        final int _tmp = entity.isRead() ? 1 : 0;
        statement.bindLong(5, _tmp);
        statement.bindString(6, entity.getCreatedAt());
        if (entity.getWallpaperSetAt() == null) {
          statement.bindNull(7);
        } else {
          statement.bindString(7, entity.getWallpaperSetAt());
        }
      }
    };
    this.__preparedStmtOfMarkAllRead = new SharedSQLiteStatement(__db) {
      @Override
      @NonNull
      public String createQuery() {
        final String _query = "UPDATE doodles SET isRead = 1 WHERE receiverId = ? AND isRead = 0";
        return _query;
      }
    };
    this.__preparedStmtOfMarkWallpaperSet = new SharedSQLiteStatement(__db) {
      @Override
      @NonNull
      public String createQuery() {
        final String _query = "UPDATE doodles SET wallpaperSetAt = ? WHERE id = ?";
        return _query;
      }
    };
  }

  @Override
  public Object insertAll(final List<DoodleEntity> doodles,
      final Continuation<List<Long>> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<List<Long>>() {
      @Override
      @NonNull
      public List<Long> call() throws Exception {
        __db.beginTransaction();
        try {
          final List<Long> _result = __insertionAdapterOfDoodleEntity.insertAndReturnIdsList(doodles);
          __db.setTransactionSuccessful();
          return _result;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object markAllRead(final String userId, final Continuation<Integer> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Integer>() {
      @Override
      @NonNull
      public Integer call() throws Exception {
        final SupportSQLiteStatement _stmt = __preparedStmtOfMarkAllRead.acquire();
        int _argIndex = 1;
        _stmt.bindString(_argIndex, userId);
        try {
          __db.beginTransaction();
          try {
            final Integer _result = _stmt.executeUpdateDelete();
            __db.setTransactionSuccessful();
            return _result;
          } finally {
            __db.endTransaction();
          }
        } finally {
          __preparedStmtOfMarkAllRead.release(_stmt);
        }
      }
    }, $completion);
  }

  @Override
  public Object markWallpaperSet(final String doodleId, final String timestamp,
      final Continuation<Integer> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Integer>() {
      @Override
      @NonNull
      public Integer call() throws Exception {
        final SupportSQLiteStatement _stmt = __preparedStmtOfMarkWallpaperSet.acquire();
        int _argIndex = 1;
        _stmt.bindString(_argIndex, timestamp);
        _argIndex = 2;
        _stmt.bindString(_argIndex, doodleId);
        try {
          __db.beginTransaction();
          try {
            final Integer _result = _stmt.executeUpdateDelete();
            __db.setTransactionSuccessful();
            return _result;
          } finally {
            __db.endTransaction();
          }
        } finally {
          __preparedStmtOfMarkWallpaperSet.release(_stmt);
        }
      }
    }, $completion);
  }

  @Override
  public Object getHistory(final String userId, final int offset, final int limit,
      final Continuation<List<DoodleEntity>> $completion) {
    final String _sql = "SELECT * FROM doodles WHERE senderId = ? OR receiverId = ? ORDER BY createdAt DESC LIMIT ? OFFSET ?";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 4);
    int _argIndex = 1;
    _statement.bindString(_argIndex, userId);
    _argIndex = 2;
    _statement.bindString(_argIndex, userId);
    _argIndex = 3;
    _statement.bindLong(_argIndex, limit);
    _argIndex = 4;
    _statement.bindLong(_argIndex, offset);
    final CancellationSignal _cancellationSignal = DBUtil.createCancellationSignal();
    return CoroutinesRoom.execute(__db, false, _cancellationSignal, new Callable<List<DoodleEntity>>() {
      @Override
      @NonNull
      public List<DoodleEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfSenderId = CursorUtil.getColumnIndexOrThrow(_cursor, "senderId");
          final int _cursorIndexOfReceiverId = CursorUtil.getColumnIndexOrThrow(_cursor, "receiverId");
          final int _cursorIndexOfImageData = CursorUtil.getColumnIndexOrThrow(_cursor, "imageData");
          final int _cursorIndexOfIsRead = CursorUtil.getColumnIndexOrThrow(_cursor, "isRead");
          final int _cursorIndexOfCreatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "createdAt");
          final int _cursorIndexOfWallpaperSetAt = CursorUtil.getColumnIndexOrThrow(_cursor, "wallpaperSetAt");
          final List<DoodleEntity> _result = new ArrayList<DoodleEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final DoodleEntity _item;
            final String _tmpId;
            _tmpId = _cursor.getString(_cursorIndexOfId);
            final String _tmpSenderId;
            _tmpSenderId = _cursor.getString(_cursorIndexOfSenderId);
            final String _tmpReceiverId;
            _tmpReceiverId = _cursor.getString(_cursorIndexOfReceiverId);
            final String _tmpImageData;
            _tmpImageData = _cursor.getString(_cursorIndexOfImageData);
            final boolean _tmpIsRead;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsRead);
            _tmpIsRead = _tmp != 0;
            final String _tmpCreatedAt;
            _tmpCreatedAt = _cursor.getString(_cursorIndexOfCreatedAt);
            final String _tmpWallpaperSetAt;
            if (_cursor.isNull(_cursorIndexOfWallpaperSetAt)) {
              _tmpWallpaperSetAt = null;
            } else {
              _tmpWallpaperSetAt = _cursor.getString(_cursorIndexOfWallpaperSetAt);
            }
            _item = new DoodleEntity(_tmpId,_tmpSenderId,_tmpReceiverId,_tmpImageData,_tmpIsRead,_tmpCreatedAt,_tmpWallpaperSetAt);
            _result.add(_item);
          }
          return _result;
        } finally {
          _cursor.close();
          _statement.release();
        }
      }
    }, $completion);
  }

  @Override
  public LiveData<DoodleEntity> observeLatest(final String userId) {
    final String _sql = "SELECT * FROM doodles WHERE (senderId = ? OR receiverId = ?) ORDER BY createdAt DESC LIMIT 1";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 2);
    int _argIndex = 1;
    _statement.bindString(_argIndex, userId);
    _argIndex = 2;
    _statement.bindString(_argIndex, userId);
    return __db.getInvalidationTracker().createLiveData(new String[] {"doodles"}, false, new Callable<DoodleEntity>() {
      @Override
      @Nullable
      public DoodleEntity call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfSenderId = CursorUtil.getColumnIndexOrThrow(_cursor, "senderId");
          final int _cursorIndexOfReceiverId = CursorUtil.getColumnIndexOrThrow(_cursor, "receiverId");
          final int _cursorIndexOfImageData = CursorUtil.getColumnIndexOrThrow(_cursor, "imageData");
          final int _cursorIndexOfIsRead = CursorUtil.getColumnIndexOrThrow(_cursor, "isRead");
          final int _cursorIndexOfCreatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "createdAt");
          final int _cursorIndexOfWallpaperSetAt = CursorUtil.getColumnIndexOrThrow(_cursor, "wallpaperSetAt");
          final DoodleEntity _result;
          if (_cursor.moveToFirst()) {
            final String _tmpId;
            _tmpId = _cursor.getString(_cursorIndexOfId);
            final String _tmpSenderId;
            _tmpSenderId = _cursor.getString(_cursorIndexOfSenderId);
            final String _tmpReceiverId;
            _tmpReceiverId = _cursor.getString(_cursorIndexOfReceiverId);
            final String _tmpImageData;
            _tmpImageData = _cursor.getString(_cursorIndexOfImageData);
            final boolean _tmpIsRead;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsRead);
            _tmpIsRead = _tmp != 0;
            final String _tmpCreatedAt;
            _tmpCreatedAt = _cursor.getString(_cursorIndexOfCreatedAt);
            final String _tmpWallpaperSetAt;
            if (_cursor.isNull(_cursorIndexOfWallpaperSetAt)) {
              _tmpWallpaperSetAt = null;
            } else {
              _tmpWallpaperSetAt = _cursor.getString(_cursorIndexOfWallpaperSetAt);
            }
            _result = new DoodleEntity(_tmpId,_tmpSenderId,_tmpReceiverId,_tmpImageData,_tmpIsRead,_tmpCreatedAt,_tmpWallpaperSetAt);
          } else {
            _result = null;
          }
          return _result;
        } finally {
          _cursor.close();
        }
      }

      @Override
      protected void finalize() {
        _statement.release();
      }
    });
  }

  @Override
  public LiveData<Integer> observeUnreadCount(final String userId) {
    final String _sql = "SELECT COUNT(*) FROM doodles WHERE receiverId = ? AND isRead = 0";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    _statement.bindString(_argIndex, userId);
    return __db.getInvalidationTracker().createLiveData(new String[] {"doodles"}, false, new Callable<Integer>() {
      @Override
      @Nullable
      public Integer call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final Integer _result;
          if (_cursor.moveToFirst()) {
            final Integer _tmp;
            if (_cursor.isNull(0)) {
              _tmp = null;
            } else {
              _tmp = _cursor.getInt(0);
            }
            _result = _tmp;
          } else {
            _result = null;
          }
          return _result;
        } finally {
          _cursor.close();
        }
      }

      @Override
      protected void finalize() {
        _statement.release();
      }
    });
  }

  @NonNull
  public static List<Class<?>> getRequiredConverters() {
    return Collections.emptyList();
  }
}
