package com.kawaii.doodle.di;

import com.kawaii.doodle.data.local.AppDatabase;
import com.kawaii.doodle.data.local.dao.DoodleDao;
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
public final class DatabaseModule_ProvideDoodleDaoFactory implements Factory<DoodleDao> {
  private final Provider<AppDatabase> dbProvider;

  public DatabaseModule_ProvideDoodleDaoFactory(Provider<AppDatabase> dbProvider) {
    this.dbProvider = dbProvider;
  }

  @Override
  public DoodleDao get() {
    return provideDoodleDao(dbProvider.get());
  }

  public static DatabaseModule_ProvideDoodleDaoFactory create(
      javax.inject.Provider<AppDatabase> dbProvider) {
    return new DatabaseModule_ProvideDoodleDaoFactory(Providers.asDaggerProvider(dbProvider));
  }

  public static DatabaseModule_ProvideDoodleDaoFactory create(Provider<AppDatabase> dbProvider) {
    return new DatabaseModule_ProvideDoodleDaoFactory(dbProvider);
  }

  public static DoodleDao provideDoodleDao(AppDatabase db) {
    return Preconditions.checkNotNullFromProvides(DatabaseModule.INSTANCE.provideDoodleDao(db));
  }
}
