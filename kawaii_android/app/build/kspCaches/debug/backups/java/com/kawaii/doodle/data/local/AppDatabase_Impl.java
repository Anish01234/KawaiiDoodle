package com.kawaii.doodle.data.local;

import androidx.annotation.NonNull;
import androidx.room.DatabaseConfiguration;
import androidx.room.InvalidationTracker;
import androidx.room.RoomDatabase;
import androidx.room.RoomOpenHelper;
import androidx.room.migration.AutoMigrationSpec;
import androidx.room.migration.Migration;
import androidx.room.util.DBUtil;
import androidx.room.util.TableInfo;
import androidx.sqlite.db.SupportSQLiteDatabase;
import androidx.sqlite.db.SupportSQLiteOpenHelper;
import com.kawaii.doodle.data.local.dao.DoodleDao;
import com.kawaii.doodle.data.local.dao.DoodleDao_Impl;
import com.kawaii.doodle.data.local.dao.DraftDao;
import com.kawaii.doodle.data.local.dao.DraftDao_Impl;
import com.kawaii.doodle.data.local.dao.FriendDao;
import com.kawaii.doodle.data.local.dao.FriendDao_Impl;
import com.kawaii.doodle.data.local.dao.ProfileDao;
import com.kawaii.doodle.data.local.dao.ProfileDao_Impl;
import java.lang.Class;
import java.lang.Override;
import java.lang.String;
import java.lang.SuppressWarnings;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import javax.annotation.processing.Generated;

@Generated("androidx.room.RoomProcessor")
@SuppressWarnings({"unchecked", "deprecation"})
public final class AppDatabase_Impl extends AppDatabase {
  private volatile DoodleDao _doodleDao;

  private volatile DraftDao _draftDao;

  private volatile FriendDao _friendDao;

  private volatile ProfileDao _profileDao;

  @Override
  @NonNull
  protected SupportSQLiteOpenHelper createOpenHelper(@NonNull final DatabaseConfiguration config) {
    final SupportSQLiteOpenHelper.Callback _openCallback = new RoomOpenHelper(config, new RoomOpenHelper.Delegate(1) {
      @Override
      public void createAllTables(@NonNull final SupportSQLiteDatabase db) {
        db.execSQL("CREATE TABLE IF NOT EXISTS `doodles` (`id` TEXT NOT NULL, `senderId` TEXT NOT NULL, `receiverId` TEXT NOT NULL, `imageData` TEXT NOT NULL, `isRead` INTEGER NOT NULL, `createdAt` TEXT NOT NULL, `wallpaperSetAt` TEXT, PRIMARY KEY(`id`))");
        db.execSQL("CREATE TABLE IF NOT EXISTS `drafts` (`id` TEXT NOT NULL, `userId` TEXT NOT NULL, `imageData` TEXT NOT NULL, `createdAt` TEXT NOT NULL, `syncPending` INTEGER NOT NULL, PRIMARY KEY(`id`))");
        db.execSQL("CREATE TABLE IF NOT EXISTS `friends` (`relId` TEXT NOT NULL, `kawaiiId` TEXT NOT NULL, `actualId` TEXT NOT NULL, `username` TEXT NOT NULL, `avatarUrl` TEXT, `status` TEXT NOT NULL, `isRequester` INTEGER NOT NULL, PRIMARY KEY(`relId`))");
        db.execSQL("CREATE TABLE IF NOT EXISTS `profiles` (`id` TEXT NOT NULL, `username` TEXT NOT NULL, `kawaiiId` TEXT NOT NULL, `avatarUrl` TEXT, `fcmToken` TEXT, PRIMARY KEY(`id`))");
        db.execSQL("CREATE TABLE IF NOT EXISTS room_master_table (id INTEGER PRIMARY KEY,identity_hash TEXT)");
        db.execSQL("INSERT OR REPLACE INTO room_master_table (id,identity_hash) VALUES(42, 'e5f56da1d431fa90252e258a1fc0055f')");
      }

      @Override
      public void dropAllTables(@NonNull final SupportSQLiteDatabase db) {
        db.execSQL("DROP TABLE IF EXISTS `doodles`");
        db.execSQL("DROP TABLE IF EXISTS `drafts`");
        db.execSQL("DROP TABLE IF EXISTS `friends`");
        db.execSQL("DROP TABLE IF EXISTS `profiles`");
        final List<? extends RoomDatabase.Callback> _callbacks = mCallbacks;
        if (_callbacks != null) {
          for (RoomDatabase.Callback _callback : _callbacks) {
            _callback.onDestructiveMigration(db);
          }
        }
      }

      @Override
      public void onCreate(@NonNull final SupportSQLiteDatabase db) {
        final List<? extends RoomDatabase.Callback> _callbacks = mCallbacks;
        if (_callbacks != null) {
          for (RoomDatabase.Callback _callback : _callbacks) {
            _callback.onCreate(db);
          }
        }
      }

      @Override
      public void onOpen(@NonNull final SupportSQLiteDatabase db) {
        mDatabase = db;
        internalInitInvalidationTracker(db);
        final List<? extends RoomDatabase.Callback> _callbacks = mCallbacks;
        if (_callbacks != null) {
          for (RoomDatabase.Callback _callback : _callbacks) {
            _callback.onOpen(db);
          }
        }
      }

      @Override
      public void onPreMigrate(@NonNull final SupportSQLiteDatabase db) {
        DBUtil.dropFtsSyncTriggers(db);
      }

      @Override
      public void onPostMigrate(@NonNull final SupportSQLiteDatabase db) {
      }

      @Override
      @NonNull
      public RoomOpenHelper.ValidationResult onValidateSchema(
          @NonNull final SupportSQLiteDatabase db) {
        final HashMap<String, TableInfo.Column> _columnsDoodles = new HashMap<String, TableInfo.Column>(7);
        _columnsDoodles.put("id", new TableInfo.Column("id", "TEXT", true, 1, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsDoodles.put("senderId", new TableInfo.Column("senderId", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsDoodles.put("receiverId", new TableInfo.Column("receiverId", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsDoodles.put("imageData", new TableInfo.Column("imageData", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsDoodles.put("isRead", new TableInfo.Column("isRead", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsDoodles.put("createdAt", new TableInfo.Column("createdAt", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsDoodles.put("wallpaperSetAt", new TableInfo.Column("wallpaperSetAt", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        final HashSet<TableInfo.ForeignKey> _foreignKeysDoodles = new HashSet<TableInfo.ForeignKey>(0);
        final HashSet<TableInfo.Index> _indicesDoodles = new HashSet<TableInfo.Index>(0);
        final TableInfo _infoDoodles = new TableInfo("doodles", _columnsDoodles, _foreignKeysDoodles, _indicesDoodles);
        final TableInfo _existingDoodles = TableInfo.read(db, "doodles");
        if (!_infoDoodles.equals(_existingDoodles)) {
          return new RoomOpenHelper.ValidationResult(false, "doodles(com.kawaii.doodle.data.local.entity.DoodleEntity).\n"
                  + " Expected:\n" + _infoDoodles + "\n"
                  + " Found:\n" + _existingDoodles);
        }
        final HashMap<String, TableInfo.Column> _columnsDrafts = new HashMap<String, TableInfo.Column>(5);
        _columnsDrafts.put("id", new TableInfo.Column("id", "TEXT", true, 1, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsDrafts.put("userId", new TableInfo.Column("userId", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsDrafts.put("imageData", new TableInfo.Column("imageData", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsDrafts.put("createdAt", new TableInfo.Column("createdAt", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsDrafts.put("syncPending", new TableInfo.Column("syncPending", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        final HashSet<TableInfo.ForeignKey> _foreignKeysDrafts = new HashSet<TableInfo.ForeignKey>(0);
        final HashSet<TableInfo.Index> _indicesDrafts = new HashSet<TableInfo.Index>(0);
        final TableInfo _infoDrafts = new TableInfo("drafts", _columnsDrafts, _foreignKeysDrafts, _indicesDrafts);
        final TableInfo _existingDrafts = TableInfo.read(db, "drafts");
        if (!_infoDrafts.equals(_existingDrafts)) {
          return new RoomOpenHelper.ValidationResult(false, "drafts(com.kawaii.doodle.data.local.entity.DraftEntity).\n"
                  + " Expected:\n" + _infoDrafts + "\n"
                  + " Found:\n" + _existingDrafts);
        }
        final HashMap<String, TableInfo.Column> _columnsFriends = new HashMap<String, TableInfo.Column>(7);
        _columnsFriends.put("relId", new TableInfo.Column("relId", "TEXT", true, 1, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsFriends.put("kawaiiId", new TableInfo.Column("kawaiiId", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsFriends.put("actualId", new TableInfo.Column("actualId", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsFriends.put("username", new TableInfo.Column("username", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsFriends.put("avatarUrl", new TableInfo.Column("avatarUrl", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsFriends.put("status", new TableInfo.Column("status", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsFriends.put("isRequester", new TableInfo.Column("isRequester", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        final HashSet<TableInfo.ForeignKey> _foreignKeysFriends = new HashSet<TableInfo.ForeignKey>(0);
        final HashSet<TableInfo.Index> _indicesFriends = new HashSet<TableInfo.Index>(0);
        final TableInfo _infoFriends = new TableInfo("friends", _columnsFriends, _foreignKeysFriends, _indicesFriends);
        final TableInfo _existingFriends = TableInfo.read(db, "friends");
        if (!_infoFriends.equals(_existingFriends)) {
          return new RoomOpenHelper.ValidationResult(false, "friends(com.kawaii.doodle.data.local.entity.FriendEntity).\n"
                  + " Expected:\n" + _infoFriends + "\n"
                  + " Found:\n" + _existingFriends);
        }
        final HashMap<String, TableInfo.Column> _columnsProfiles = new HashMap<String, TableInfo.Column>(5);
        _columnsProfiles.put("id", new TableInfo.Column("id", "TEXT", true, 1, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsProfiles.put("username", new TableInfo.Column("username", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsProfiles.put("kawaiiId", new TableInfo.Column("kawaiiId", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsProfiles.put("avatarUrl", new TableInfo.Column("avatarUrl", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsProfiles.put("fcmToken", new TableInfo.Column("fcmToken", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        final HashSet<TableInfo.ForeignKey> _foreignKeysProfiles = new HashSet<TableInfo.ForeignKey>(0);
        final HashSet<TableInfo.Index> _indicesProfiles = new HashSet<TableInfo.Index>(0);
        final TableInfo _infoProfiles = new TableInfo("profiles", _columnsProfiles, _foreignKeysProfiles, _indicesProfiles);
        final TableInfo _existingProfiles = TableInfo.read(db, "profiles");
        if (!_infoProfiles.equals(_existingProfiles)) {
          return new RoomOpenHelper.ValidationResult(false, "profiles(com.kawaii.doodle.data.local.entity.ProfileEntity).\n"
                  + " Expected:\n" + _infoProfiles + "\n"
                  + " Found:\n" + _existingProfiles);
        }
        return new RoomOpenHelper.ValidationResult(true, null);
      }
    }, "e5f56da1d431fa90252e258a1fc0055f", "914902fd2e39defc9728e8a85d3289a3");
    final SupportSQLiteOpenHelper.Configuration _sqliteConfig = SupportSQLiteOpenHelper.Configuration.builder(config.context).name(config.name).callback(_openCallback).build();
    final SupportSQLiteOpenHelper _helper = config.sqliteOpenHelperFactory.create(_sqliteConfig);
    return _helper;
  }

  @Override
  @NonNull
  protected InvalidationTracker createInvalidationTracker() {
    final HashMap<String, String> _shadowTablesMap = new HashMap<String, String>(0);
    final HashMap<String, Set<String>> _viewTables = new HashMap<String, Set<String>>(0);
    return new InvalidationTracker(this, _shadowTablesMap, _viewTables, "doodles","drafts","friends","profiles");
  }

  @Override
  public void clearAllTables() {
    super.assertNotMainThread();
    final SupportSQLiteDatabase _db = super.getOpenHelper().getWritableDatabase();
    try {
      super.beginTransaction();
      _db.execSQL("DELETE FROM `doodles`");
      _db.execSQL("DELETE FROM `drafts`");
      _db.execSQL("DELETE FROM `friends`");
      _db.execSQL("DELETE FROM `profiles`");
      super.setTransactionSuccessful();
    } finally {
      super.endTransaction();
      _db.query("PRAGMA wal_checkpoint(FULL)").close();
      if (!_db.inTransaction()) {
        _db.execSQL("VACUUM");
      }
    }
  }

  @Override
  @NonNull
  protected Map<Class<?>, List<Class<?>>> getRequiredTypeConverters() {
    final HashMap<Class<?>, List<Class<?>>> _typeConvertersMap = new HashMap<Class<?>, List<Class<?>>>();
    _typeConvertersMap.put(DoodleDao.class, DoodleDao_Impl.getRequiredConverters());
    _typeConvertersMap.put(DraftDao.class, DraftDao_Impl.getRequiredConverters());
    _typeConvertersMap.put(FriendDao.class, FriendDao_Impl.getRequiredConverters());
    _typeConvertersMap.put(ProfileDao.class, ProfileDao_Impl.getRequiredConverters());
    return _typeConvertersMap;
  }

  @Override
  @NonNull
  public Set<Class<? extends AutoMigrationSpec>> getRequiredAutoMigrationSpecs() {
    final HashSet<Class<? extends AutoMigrationSpec>> _autoMigrationSpecsSet = new HashSet<Class<? extends AutoMigrationSpec>>();
    return _autoMigrationSpecsSet;
  }

  @Override
  @NonNull
  public List<Migration> getAutoMigrations(
      @NonNull final Map<Class<? extends AutoMigrationSpec>, AutoMigrationSpec> autoMigrationSpecs) {
    final List<Migration> _autoMigrations = new ArrayList<Migration>();
    return _autoMigrations;
  }

  @Override
  public DoodleDao doodleDao() {
    if (_doodleDao != null) {
      return _doodleDao;
    } else {
      synchronized(this) {
        if(_doodleDao == null) {
          _doodleDao = new DoodleDao_Impl(this);
        }
        return _doodleDao;
      }
    }
  }

  @Override
  public DraftDao draftDao() {
    if (_draftDao != null) {
      return _draftDao;
    } else {
      synchronized(this) {
        if(_draftDao == null) {
          _draftDao = new DraftDao_Impl(this);
        }
        return _draftDao;
      }
    }
  }

  @Override
  public FriendDao friendDao() {
    if (_friendDao != null) {
      return _friendDao;
    } else {
      synchronized(this) {
        if(_friendDao == null) {
          _friendDao = new FriendDao_Impl(this);
        }
        return _friendDao;
      }
    }
  }

  @Override
  public ProfileDao profileDao() {
    if (_profileDao != null) {
      return _profileDao;
    } else {
      synchronized(this) {
        if(_profileDao == null) {
          _profileDao = new ProfileDao_Impl(this);
        }
        return _profileDao;
      }
    }
  }
}
