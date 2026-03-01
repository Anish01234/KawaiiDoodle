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
import com.kawaii.doodle.data.local.entity.FriendEntity;
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
public final class FriendDao_Impl implements FriendDao {
  private final RoomDatabase __db;

  private final EntityInsertionAdapter<FriendEntity> __insertionAdapterOfFriendEntity;

  private final SharedSQLiteStatement __preparedStmtOfDeleteByRelId;

  private final SharedSQLiteStatement __preparedStmtOfDeleteAll;

  private final SharedSQLiteStatement __preparedStmtOfMarkAccepted;

  public FriendDao_Impl(@NonNull final RoomDatabase __db) {
    this.__db = __db;
    this.__insertionAdapterOfFriendEntity = new EntityInsertionAdapter<FriendEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "INSERT OR REPLACE INTO `friends` (`relId`,`kawaiiId`,`actualId`,`username`,`avatarUrl`,`status`,`isRequester`) VALUES (?,?,?,?,?,?,?)";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final FriendEntity entity) {
        statement.bindString(1, entity.getRelId());
        statement.bindString(2, entity.getKawaiiId());
        statement.bindString(3, entity.getActualId());
        statement.bindString(4, entity.getUsername());
        if (entity.getAvatarUrl() == null) {
          statement.bindNull(5);
        } else {
          statement.bindString(5, entity.getAvatarUrl());
        }
        statement.bindString(6, entity.getStatus());
        final int _tmp = entity.isRequester() ? 1 : 0;
        statement.bindLong(7, _tmp);
      }
    };
    this.__preparedStmtOfDeleteByRelId = new SharedSQLiteStatement(__db) {
      @Override
      @NonNull
      public String createQuery() {
        final String _query = "DELETE FROM friends WHERE relId = ?";
        return _query;
      }
    };
    this.__preparedStmtOfDeleteAll = new SharedSQLiteStatement(__db) {
      @Override
      @NonNull
      public String createQuery() {
        final String _query = "DELETE FROM friends";
        return _query;
      }
    };
    this.__preparedStmtOfMarkAccepted = new SharedSQLiteStatement(__db) {
      @Override
      @NonNull
      public String createQuery() {
        final String _query = "UPDATE friends SET status = 'accepted' WHERE relId = ?";
        return _query;
      }
    };
  }

  @Override
  public Object insertAll(final List<FriendEntity> friends,
      final Continuation<List<Long>> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<List<Long>>() {
      @Override
      @NonNull
      public List<Long> call() throws Exception {
        __db.beginTransaction();
        try {
          final List<Long> _result = __insertionAdapterOfFriendEntity.insertAndReturnIdsList(friends);
          __db.setTransactionSuccessful();
          return _result;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object deleteByRelId(final String relId, final Continuation<Integer> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Integer>() {
      @Override
      @NonNull
      public Integer call() throws Exception {
        final SupportSQLiteStatement _stmt = __preparedStmtOfDeleteByRelId.acquire();
        int _argIndex = 1;
        _stmt.bindString(_argIndex, relId);
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
          __preparedStmtOfDeleteByRelId.release(_stmt);
        }
      }
    }, $completion);
  }

  @Override
  public Object deleteAll(final Continuation<Integer> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Integer>() {
      @Override
      @NonNull
      public Integer call() throws Exception {
        final SupportSQLiteStatement _stmt = __preparedStmtOfDeleteAll.acquire();
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
          __preparedStmtOfDeleteAll.release(_stmt);
        }
      }
    }, $completion);
  }

  @Override
  public Object markAccepted(final String relId, final Continuation<Integer> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Integer>() {
      @Override
      @NonNull
      public Integer call() throws Exception {
        final SupportSQLiteStatement _stmt = __preparedStmtOfMarkAccepted.acquire();
        int _argIndex = 1;
        _stmt.bindString(_argIndex, relId);
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
          __preparedStmtOfMarkAccepted.release(_stmt);
        }
      }
    }, $completion);
  }

  @Override
  public LiveData<List<FriendEntity>> observeFriends() {
    final String _sql = "SELECT * FROM friends ORDER BY username ASC";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 0);
    return __db.getInvalidationTracker().createLiveData(new String[] {"friends"}, false, new Callable<List<FriendEntity>>() {
      @Override
      @Nullable
      public List<FriendEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfRelId = CursorUtil.getColumnIndexOrThrow(_cursor, "relId");
          final int _cursorIndexOfKawaiiId = CursorUtil.getColumnIndexOrThrow(_cursor, "kawaiiId");
          final int _cursorIndexOfActualId = CursorUtil.getColumnIndexOrThrow(_cursor, "actualId");
          final int _cursorIndexOfUsername = CursorUtil.getColumnIndexOrThrow(_cursor, "username");
          final int _cursorIndexOfAvatarUrl = CursorUtil.getColumnIndexOrThrow(_cursor, "avatarUrl");
          final int _cursorIndexOfStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "status");
          final int _cursorIndexOfIsRequester = CursorUtil.getColumnIndexOrThrow(_cursor, "isRequester");
          final List<FriendEntity> _result = new ArrayList<FriendEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final FriendEntity _item;
            final String _tmpRelId;
            _tmpRelId = _cursor.getString(_cursorIndexOfRelId);
            final String _tmpKawaiiId;
            _tmpKawaiiId = _cursor.getString(_cursorIndexOfKawaiiId);
            final String _tmpActualId;
            _tmpActualId = _cursor.getString(_cursorIndexOfActualId);
            final String _tmpUsername;
            _tmpUsername = _cursor.getString(_cursorIndexOfUsername);
            final String _tmpAvatarUrl;
            if (_cursor.isNull(_cursorIndexOfAvatarUrl)) {
              _tmpAvatarUrl = null;
            } else {
              _tmpAvatarUrl = _cursor.getString(_cursorIndexOfAvatarUrl);
            }
            final String _tmpStatus;
            _tmpStatus = _cursor.getString(_cursorIndexOfStatus);
            final boolean _tmpIsRequester;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsRequester);
            _tmpIsRequester = _tmp != 0;
            _item = new FriendEntity(_tmpRelId,_tmpKawaiiId,_tmpActualId,_tmpUsername,_tmpAvatarUrl,_tmpStatus,_tmpIsRequester);
            _result.add(_item);
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
  public Object getFriends(final Continuation<List<FriendEntity>> $completion) {
    final String _sql = "SELECT * FROM friends ORDER BY username ASC";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 0);
    final CancellationSignal _cancellationSignal = DBUtil.createCancellationSignal();
    return CoroutinesRoom.execute(__db, false, _cancellationSignal, new Callable<List<FriendEntity>>() {
      @Override
      @NonNull
      public List<FriendEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfRelId = CursorUtil.getColumnIndexOrThrow(_cursor, "relId");
          final int _cursorIndexOfKawaiiId = CursorUtil.getColumnIndexOrThrow(_cursor, "kawaiiId");
          final int _cursorIndexOfActualId = CursorUtil.getColumnIndexOrThrow(_cursor, "actualId");
          final int _cursorIndexOfUsername = CursorUtil.getColumnIndexOrThrow(_cursor, "username");
          final int _cursorIndexOfAvatarUrl = CursorUtil.getColumnIndexOrThrow(_cursor, "avatarUrl");
          final int _cursorIndexOfStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "status");
          final int _cursorIndexOfIsRequester = CursorUtil.getColumnIndexOrThrow(_cursor, "isRequester");
          final List<FriendEntity> _result = new ArrayList<FriendEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final FriendEntity _item;
            final String _tmpRelId;
            _tmpRelId = _cursor.getString(_cursorIndexOfRelId);
            final String _tmpKawaiiId;
            _tmpKawaiiId = _cursor.getString(_cursorIndexOfKawaiiId);
            final String _tmpActualId;
            _tmpActualId = _cursor.getString(_cursorIndexOfActualId);
            final String _tmpUsername;
            _tmpUsername = _cursor.getString(_cursorIndexOfUsername);
            final String _tmpAvatarUrl;
            if (_cursor.isNull(_cursorIndexOfAvatarUrl)) {
              _tmpAvatarUrl = null;
            } else {
              _tmpAvatarUrl = _cursor.getString(_cursorIndexOfAvatarUrl);
            }
            final String _tmpStatus;
            _tmpStatus = _cursor.getString(_cursorIndexOfStatus);
            final boolean _tmpIsRequester;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsRequester);
            _tmpIsRequester = _tmp != 0;
            _item = new FriendEntity(_tmpRelId,_tmpKawaiiId,_tmpActualId,_tmpUsername,_tmpAvatarUrl,_tmpStatus,_tmpIsRequester);
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

  @NonNull
  public static List<Class<?>> getRequiredConverters() {
    return Collections.emptyList();
  }
}
