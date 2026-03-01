package com.kawaii.doodle.worker;

import android.content.Context;
import androidx.work.WorkerParameters;
import dagger.internal.DaggerGenerated;
import dagger.internal.InstanceFactory;
import javax.annotation.processing.Generated;
import javax.inject.Provider;

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
public final class CriticalHealthWorker_AssistedFactory_Impl implements CriticalHealthWorker_AssistedFactory {
  private final CriticalHealthWorker_Factory delegateFactory;

  CriticalHealthWorker_AssistedFactory_Impl(CriticalHealthWorker_Factory delegateFactory) {
    this.delegateFactory = delegateFactory;
  }

  @Override
  public CriticalHealthWorker create(Context p0, WorkerParameters p1) {
    return delegateFactory.get(p0, p1);
  }

  public static Provider<CriticalHealthWorker_AssistedFactory> create(
      CriticalHealthWorker_Factory delegateFactory) {
    return InstanceFactory.create(new CriticalHealthWorker_AssistedFactory_Impl(delegateFactory));
  }

  public static dagger.internal.Provider<CriticalHealthWorker_AssistedFactory> createFactoryProvider(
      CriticalHealthWorker_Factory delegateFactory) {
    return InstanceFactory.create(new CriticalHealthWorker_AssistedFactory_Impl(delegateFactory));
  }
}
