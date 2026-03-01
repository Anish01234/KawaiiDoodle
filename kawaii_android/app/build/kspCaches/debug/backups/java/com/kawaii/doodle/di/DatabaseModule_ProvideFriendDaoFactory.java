package com.kawaii.doodle.di;

import com.kawaii.doodle.data.local.AppDatabase;
import com.kawaii.doodle.data.local.dao.FriendDao;
import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.Preconditions;
import dagger.internal.Provider;
import dagger.internal.Providers;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;

@ScopeMetadata
@QualifierMetadata
@DaggerGenerated
@Generated(
    value = "dagger.internal.codegen.ComponentProcessor",
    comments = "https://dagger.dev"
)
@SuppressWarnings({
    "unchecked",
    "rawtypes",
    "KotlinInternal",
    "KotlinInternalInJava",
    "cast",
    "deprecation",
    "nullness:initialization.field.uninitialized"
})
public final class DatabaseModule_ProvideFriendDaoFactory implements Factory<FriendDao> {
  private final Provider<AppDatabase> dbProvider;

  public DatabaseModule_ProvideFriendDaoFactory(Provider<AppDatabase> dbProvider) {
    this.dbProvider = dbProvider;
  }

  @Override
  public FriendDao get() {
    return provideFriendDao(dbProvider.get());
  }

  public static DatabaseModule_ProvideFriendDaoFactory create(
      javax.inject.Provider<AppDatabase> dbProvider) {
    return new DatabaseModule_ProvideFriendDaoFactory(Providers.asDaggerProvider(dbProvider));
  }

  public static DatabaseModule_ProvideFriendDaoFactory create(Provider<AppDatabase> dbProvider) {
    return new DatabaseModule_ProvideFriendDaoFactory(dbProvider);
  }

  public static FriendDao provideFriendDao(AppDatabase db) {
    return Preconditions.checkNotNullFromProvides(DatabaseModule.INSTANCE.provideFriendDao(db));
  }
}
